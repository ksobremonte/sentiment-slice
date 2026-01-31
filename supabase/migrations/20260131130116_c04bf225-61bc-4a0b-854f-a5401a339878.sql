-- Add policy to allow anonymous users to insert reviews (public review form)
CREATE POLICY "Anyone can insert reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (true);

-- Note: The existing SELECT policy is for authenticated users only,
-- which is correct for the admin dashboard.