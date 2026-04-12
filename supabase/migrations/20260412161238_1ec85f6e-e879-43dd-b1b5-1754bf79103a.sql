
-- Create table for storing WebAuthn credentials
CREATE TABLE public.webauthn_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  device_name TEXT DEFAULT 'Security Key',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX idx_webauthn_credentials_user_id ON public.webauthn_credentials (user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON public.webauthn_credentials (credential_id);

-- Enable RLS
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can read their own credentials
CREATE POLICY "Users can read own passkeys"
ON public.webauthn_credentials FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own credentials
CREATE POLICY "Users can delete own passkeys"
ON public.webauthn_credentials FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Service role manages insert/update during registration and authentication
CREATE POLICY "Service role can manage passkeys"
ON public.webauthn_credentials FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also store challenges temporarily for WebAuthn flows
CREATE TABLE public.webauthn_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'authentication',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_webauthn_challenges_user_id ON public.webauthn_challenges (user_id);

ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Only service role manages challenges
CREATE POLICY "Service role can manage challenges"
ON public.webauthn_challenges FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
