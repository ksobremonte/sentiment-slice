
-- Create system_logs table for admin dashboard
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'GET',
  status_code INTEGER NOT NULL DEFAULT 200,
  endpoint TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('success', 'warning', 'error', 'info'))
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can read logs
CREATE POLICY "Admins can read system logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow service role inserts (edge functions, triggers)
CREATE POLICY "Service can insert logs"
  ON public.system_logs FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;

-- Index for common queries
CREATE INDEX idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs (level);

-- Insert some seed data for demo
INSERT INTO public.system_logs (method, status_code, endpoint, message, level, created_at) VALUES
  ('GET', 200, '/api/reviews', 'Fetched 25 reviews successfully', 'success', now() - interval '5 minutes'),
  ('POST', 201, '/api/reviews', 'New review submitted by customer', 'success', now() - interval '12 minutes'),
  ('POST', 200, '/api/analyze-reviews', 'Sentiment analysis completed for 5 reviews', 'success', now() - interval '30 minutes'),
  ('POST', 500, '/api/customer-chat', 'AI response generation failed: timeout', 'error', now() - interval '1 hour'),
  ('GET', 401, '/api/users', 'Unauthorized access attempt blocked', 'warning', now() - interval '2 hours'),
  ('POST', 200, '/api/help-assistant', 'Help assistant responded successfully', 'success', now() - interval '3 hours'),
  ('DELETE', 200, '/api/reviews/abc123', 'Review deleted by admin', 'warning', now() - interval '4 hours'),
  ('PUT', 200, '/api/settings', 'Alert threshold updated to 35%', 'success', now() - interval '5 hours'),
  ('POST', 429, '/api/analyze-reviews', 'Rate limit exceeded for AI analysis', 'error', now() - interval '6 hours'),
  ('GET', 200, '/api/trends', 'Trends data fetched for last 30 days', 'success', now() - interval '8 hours'),
  ('POST', 400, '/api/reviews', 'Invalid review submission: missing required fields', 'error', now() - interval '10 hours'),
  ('GET', 200, '/api/alerts', 'Alert history retrieved', 'success', now() - interval '12 hours'),
  ('POST', 200, '/api/customer-chat', 'Customer conversation started', 'success', now() - interval '1 day'),
  ('GET', 503, '/api/external-service', 'External service unavailable', 'error', now() - interval '1 day 2 hours'),
  ('POST', 200, '/api/upload-review-photo', 'Photo uploaded successfully', 'success', now() - interval '2 days');
