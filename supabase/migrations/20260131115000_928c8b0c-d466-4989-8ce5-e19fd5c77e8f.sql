-- Fix 1: Remove email exposure - Update the reviews_public view to exclude receipt_number
-- The view already excludes email, but we need to also exclude receipt_number

DROP VIEW IF EXISTS public.reviews_public;

-- Create a secure view that excludes sensitive data (email is not included, and now also exclude receipt_number)
CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
  SELECT 
    id, 
    name, 
    rating, 
    feedback, 
    sentiment, 
    created_at,
    photo_url
  FROM public.reviews;

-- Fix 2: Enable RLS on the reviews_public view
-- Views with security_invoker=on inherit RLS from the base table
-- But we need to ensure proper access control

-- Grant SELECT only to authenticated users (not public)
REVOKE ALL ON public.reviews_public FROM anon, public;
GRANT SELECT ON public.reviews_public TO authenticated;

-- Fix 3: Fix the base reviews table - block direct SELECT for non-admins
-- Create a more restrictive SELECT policy that denies direct access to the reviews table
-- The dashboard should use the reviews_public view instead

-- First, drop the existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read reviews" ON public.reviews;

-- Create a new policy that blocks direct SELECT (forces use of view)
CREATE POLICY "No direct SELECT - use reviews_public view"
ON public.reviews
FOR SELECT
USING (false);

-- Fix 4: Remove unrestricted storage upload policy
DROP POLICY IF EXISTS "Anyone can upload review photos" ON storage.objects;

-- Only allow uploads via service_role (Edge Function)
CREATE POLICY "Service role only uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos' AND
  auth.role() = 'service_role'
);