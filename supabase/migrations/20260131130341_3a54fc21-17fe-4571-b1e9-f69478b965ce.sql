-- Drop the existing restrictive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.reviews;

-- Create a PERMISSIVE INSERT policy (this is the default behavior)
CREATE POLICY "Public can submit reviews" 
ON public.reviews 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);