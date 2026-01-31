-- Drop the existing restrictive SELECT policy on reviews
DROP POLICY IF EXISTS "No direct SELECT - use reviews_public view" ON public.reviews;

-- Create a permissive SELECT policy for authenticated users on the base table
-- This allows the view (with security_invoker) to read data when queried by authenticated users
CREATE POLICY "Authenticated users can read reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);

-- Recreate the view with security_invoker so it respects the caller's permissions
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
  photo_url
FROM public.reviews;