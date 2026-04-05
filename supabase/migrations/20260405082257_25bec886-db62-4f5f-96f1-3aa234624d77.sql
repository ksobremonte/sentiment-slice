
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own OTP codes"
  ON public.otp_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_otp_codes_user_expires ON public.otp_codes (user_id, expires_at DESC);
CREATE INDEX idx_otp_codes_email_code ON public.otp_codes (email, code);
