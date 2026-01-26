-- Fix the view to use security invoker instead of security definer
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  rating,
  feedback,
  sentiment,
  created_at,
  receipt_number,
  photo_url
FROM public.reviews;