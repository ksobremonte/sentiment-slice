
-- Function to delete system_logs older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_system_logs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.system_logs
  WHERE created_at < now() - interval '30 days';
  RETURN NEW;
END;
$$;

-- Trigger that runs cleanup on every insert
CREATE TRIGGER trg_cleanup_old_system_logs
AFTER INSERT ON public.system_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_system_logs();
