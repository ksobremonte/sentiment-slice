
-- Function to check alert threshold after each new review
CREATE OR REPLACE FUNCTION public.check_alert_threshold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_threshold integer;
  v_today_total integer;
  v_today_negative integer;
  v_percentage numeric;
  v_level text;
  v_top_keyword text;
  v_existing_alert_count integer;
  v_words text[];
  v_word text;
  v_word_counts jsonb := '{}'::jsonb;
  v_review record;
BEGIN
  -- Get threshold
  SELECT threshold_percentage INTO v_threshold
  FROM public.alert_settings LIMIT 1;
  
  IF v_threshold IS NULL THEN
    v_threshold := 30;
  END IF;

  -- Count today's reviews
  SELECT COUNT(*) INTO v_today_total
  FROM public.reviews
  WHERE created_at >= date_trunc('day', now());

  SELECT COUNT(*) INTO v_today_negative
  FROM public.reviews
  WHERE created_at >= date_trunc('day', now())
    AND sentiment = 'negative';

  IF v_today_total = 0 THEN
    RETURN NEW;
  END IF;

  v_percentage := (v_today_negative::numeric / v_today_total::numeric) * 100;

  -- Determine alert level
  IF v_percentage >= v_threshold + 20 THEN
    v_level := 'critical';
  ELSIF v_percentage >= v_threshold THEN
    v_level := 'moderate';
  ELSE
    RETURN NEW; -- No alert needed
  END IF;

  -- Don't create duplicate alerts within the same hour
  SELECT COUNT(*) INTO v_existing_alert_count
  FROM public.alert_history
  WHERE created_at >= date_trunc('hour', now())
    AND alert_level = v_level;

  IF v_existing_alert_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Find top keyword from today's negative reviews
  FOR v_review IN
    SELECT feedback FROM public.reviews
    WHERE created_at >= date_trunc('day', now()) AND sentiment = 'negative'
  LOOP
    FOREACH v_word IN ARRAY string_to_array(lower(v_review.feedback), ' ')
    LOOP
      IF length(v_word) > 4 THEN
        v_word_counts := jsonb_set(
          v_word_counts,
          ARRAY[v_word],
          to_jsonb(COALESCE((v_word_counts ->> v_word)::integer, 0) + 1)
        );
      END IF;
    END LOOP;
  END LOOP;

  SELECT key INTO v_top_keyword
  FROM jsonb_each_text(v_word_counts)
  ORDER BY value::integer DESC
  LIMIT 1;

  -- Insert alert
  INSERT INTO public.alert_history (
    alert_level, message, negative_percentage, 
    review_count, negative_count, top_keyword
  ) VALUES (
    v_level,
    CASE v_level
      WHEN 'critical' THEN 'CRITICAL: Negative sentiment at ' || round(v_percentage, 1) || '% — immediate attention required'
      ELSE 'WARNING: Negative sentiment rising at ' || round(v_percentage, 1) || '%'
    END,
    v_percentage,
    v_today_total,
    v_today_negative,
    v_top_keyword
  );

  RETURN NEW;
END;
$$;

-- Trigger on new review insert
CREATE TRIGGER trigger_check_alert_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.check_alert_threshold();

-- Enable realtime for alert_history so dashboard gets live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.alert_history;
