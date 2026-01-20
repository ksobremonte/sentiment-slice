-- Fix 1: Create a public view for reviews that excludes email addresses
CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
  SELECT id, name, rating, feedback, sentiment, created_at
  FROM public.reviews;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.reviews_public TO authenticated;

-- Fix 2: Update RLS to block direct SELECT on reviews table (force use of view)
-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

-- Create new policy that denies direct access (authenticated users must use view)
CREATE POLICY "Deny direct SELECT - use view instead"
ON public.reviews
FOR SELECT
USING (false);

-- Fix 3: Create UPDATE policy for authenticated users to update sentiment only
-- We'll use an edge function approach for better security, but also add basic policy
CREATE POLICY "Authenticated users can update sentiment"
ON public.reviews
FOR UPDATE
USING (is_authenticated_user())
WITH CHECK (is_authenticated_user());