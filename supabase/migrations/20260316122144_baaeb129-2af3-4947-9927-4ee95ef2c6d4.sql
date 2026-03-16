CREATE POLICY "Public can read approved reviews"
ON public.reviews
FOR SELECT
TO anon
USING (approved = true);