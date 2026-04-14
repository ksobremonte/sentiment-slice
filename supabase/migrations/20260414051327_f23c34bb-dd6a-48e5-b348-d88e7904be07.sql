CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'total', COUNT(*),
    'positive', COUNT(*) FILTER (WHERE sentiment = 'positive'),
    'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral'),
    'negative', COUNT(*) FILTER (WHERE sentiment = 'negative'),
    'avg_rating', ROUND(COALESCE(AVG(rating), 0)::numeric, 1),
    'active_users', (
      SELECT COUNT(DISTINCT name)
      FROM reviews
      WHERE created_at >= now() - interval '7 days'
    )
  )
  FROM reviews;
$$;