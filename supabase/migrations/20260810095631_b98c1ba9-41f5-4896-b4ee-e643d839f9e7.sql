-- 1. review_audit_log: admin only
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON public.review_audit_log;
DROP POLICY IF EXISTS "Authenticated users can read audit log" ON public.review_audit_log;
CREATE POLICY "Admins can read audit log" ON public.review_audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit log" ON public.review_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. system_logs: only service_role may insert
DROP POLICY IF EXISTS "Service can insert logs" ON public.system_logs;
CREATE POLICY "Service can insert logs" ON public.system_logs
  FOR INSERT TO service_role WITH CHECK (true);
REVOKE INSERT ON public.system_logs FROM anon, authenticated;
GRANT ALL ON public.system_logs TO service_role;

-- 3. reviews: hide email (and other sensitive fields) from anonymous readers
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved, is_generated, admin_response, admin_response_at, sentiment_reason, sentiment_keywords)
  ON public.reviews TO anon;

-- 4. Stop broadcasting sensitive log tables over Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.access_logs;
ALTER PUBLICATION supabase_realtime DROP TABLE public.system_logs;

-- 5. Public buckets: remove broad listing policies (public URLs still work)
DROP POLICY IF EXISTS "Review photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- 6. Fixed search_path on remaining functions
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';

-- 7. Revoke direct execution of internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_alert_threshold() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_system_logs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
