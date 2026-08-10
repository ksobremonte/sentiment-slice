REVOKE EXECUTE ON FUNCTION public.check_alert_threshold() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_system_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_conversation_timestamp() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_authenticated_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_review_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_own_reaction(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_own_reaction(uuid, text, text) FROM PUBLIC;

-- Service role keeps full access to the email queue plumbing
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

-- Client-facing functions the public site and dashboard rely on
GRANT EXECUTE ON FUNCTION public.get_review_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_reaction(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_reaction(uuid, text, text) TO anon, authenticated;

-- Required by row-level security policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_authenticated_user() TO authenticated, service_role;
