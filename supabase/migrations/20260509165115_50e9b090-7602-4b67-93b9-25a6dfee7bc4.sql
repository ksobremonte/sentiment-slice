CREATE TABLE public.report_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  report_name text NOT NULL,
  report_type text NOT NULL DEFAULT 'sales',
  format text NOT NULL DEFAULT 'PDF',
  size_bytes bigint,
  date_from date,
  date_to date,
  row_count integer,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text
);

ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reports"
ON public.report_history FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reports"
ON public.report_history FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete reports"
ON public.report_history FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_report_history_created_at ON public.report_history(created_at DESC);