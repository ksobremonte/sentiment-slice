
-- Alert settings table (singleton per admin)
CREATE TABLE public.alert_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  threshold_percentage integer NOT NULL DEFAULT 30,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alert settings"
  ON public.alert_settings FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can update alert settings"
  ON public.alert_settings FOR UPDATE
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert alert settings"
  ON public.alert_settings FOR INSERT
  WITH CHECK (is_authenticated_user());

-- Insert default settings
INSERT INTO public.alert_settings (threshold_percentage) VALUES (30);

-- Alert history log table
CREATE TABLE public.alert_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_level text NOT NULL DEFAULT 'normal',
  message text NOT NULL,
  negative_percentage numeric(5,2) NOT NULL,
  top_keyword text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  review_count integer NOT NULL DEFAULT 0,
  negative_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read alert history"
  ON public.alert_history FOR SELECT
  USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert alert history"
  ON public.alert_history FOR INSERT
  WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can delete alert history"
  ON public.alert_history FOR DELETE
  USING (is_authenticated_user());
