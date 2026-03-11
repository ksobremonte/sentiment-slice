
CREATE TABLE public.blocked_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  blocked_by uuid,
  blocked_at timestamp with time zone NOT NULL DEFAULT now(),
  reason text DEFAULT 'Blocked by admin'
);

ALTER TABLE public.blocked_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read blocked sessions"
ON public.blocked_sessions FOR SELECT
TO authenticated
USING (is_authenticated_user());

CREATE POLICY "Authenticated users can insert blocked sessions"
ON public.blocked_sessions FOR INSERT
TO authenticated
WITH CHECK (is_authenticated_user());

CREATE POLICY "Authenticated users can delete blocked sessions"
ON public.blocked_sessions FOR DELETE
TO authenticated
USING (is_authenticated_user());
