
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_generated boolean NOT NULL DEFAULT false;

-- Update the reviews_public view to include is_generated
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved, is_generated
FROM public.reviews
WHERE approved = true;
