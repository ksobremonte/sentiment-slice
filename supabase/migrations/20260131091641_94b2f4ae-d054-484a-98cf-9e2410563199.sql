-- Allow dashboard to read directly from the base table (required to fetch from public.reviews)
-- 1) Remove the always-false SELECT policy that blocks all reads
DROP POLICY IF EXISTS "Deny direct SELECT - use view instead" ON public.reviews;

-- 2) Permit authenticated dashboard users to SELECT reviews (includes PII column 'email', so keep this restricted)
CREATE POLICY "Authenticated users can read reviews"
ON public.reviews
FOR SELECT
USING (public.is_authenticated_user());

-- 3) Ensure realtime broadcasts include the reviews table (safe if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;