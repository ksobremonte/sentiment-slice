
-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public
WITH (security_invoker = true)
AS
  SELECT id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved
  FROM public.reviews
  WHERE approved = true;
