-- Add language and approved columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN language text DEFAULT NULL,
ADD COLUMN approved boolean DEFAULT true;

-- Update RLS policy for updates to include approved column
DROP POLICY IF EXISTS "Authenticated users can update sentiment" ON public.reviews;

CREATE POLICY "Authenticated users can update reviews"
ON public.reviews
FOR UPDATE
USING (is_authenticated_user())
WITH CHECK (is_authenticated_user());

-- Recreate the reviews_public view to include approved filter
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  rating,
  feedback,
  sentiment,
  created_at,
  photo_url,
  language,
  approved
FROM public.reviews
WHERE approved = true;

-- Add policy for authenticated users to delete reviews
CREATE POLICY "Authenticated users can delete reviews"
ON public.reviews
FOR DELETE
USING (is_authenticated_user());