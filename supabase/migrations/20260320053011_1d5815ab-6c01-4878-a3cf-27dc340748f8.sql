
-- Add photo_urls array column to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT NULL;

-- Recreate the public view to include photo_urls
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
  SELECT id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved
  FROM public.reviews
  WHERE approved = true;
