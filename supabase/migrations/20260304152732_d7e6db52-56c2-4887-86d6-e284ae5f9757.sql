
-- Add appearance preferences to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS font_size text NOT NULL DEFAULT 'medium';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';

-- Login activity tracking
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_in_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own login activity"
  ON public.login_activity FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert own login activity"
  ON public.login_activity FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
