
-- Create archived_records table for soft-delete / trash bin
CREATE TABLE public.archived_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table text NOT NULL,
  record_id uuid NOT NULL,
  record_data jsonb NOT NULL,
  deleted_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

-- Enable RLS
ALTER TABLE public.archived_records ENABLE ROW LEVEL SECURITY;

-- Only admins can access archived records
CREATE POLICY "Admins can read archived records"
  ON public.archived_records FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert archived records"
  ON public.archived_records FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete archived records"
  ON public.archived_records FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast lookups
CREATE INDEX idx_archived_records_source ON public.archived_records(source_table);
CREATE INDEX idx_archived_records_deleted_at ON public.archived_records(deleted_at DESC);
