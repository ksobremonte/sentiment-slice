-- The issue: The SELECT policy on reviews is RESTRICTIVE (not permissive)
-- This blocks anonymous users from reading through the view

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read reviews" ON public.reviews;

-- Create a permissive policy that allows public SELECT access
-- (The view reviews_public already filters out sensitive columns like email)
CREATE POLICY "Anyone can read reviews"
ON public.reviews
FOR SELECT
USING (true);