
-- Create backup_history table
CREATE TABLE public.backup_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  backup_name text NOT NULL,
  backup_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'completed',
  size_bytes bigint,
  tables_included text[] DEFAULT '{}',
  notes text,
  restore_point_id text
);

-- Enable RLS
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Only admins can read backup history
CREATE POLICY "Admins can read backup history"
ON public.backup_history FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create backups
CREATE POLICY "Admins can insert backup history"
ON public.backup_history FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete backup history
CREATE POLICY "Admins can delete backup history"
ON public.backup_history FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
