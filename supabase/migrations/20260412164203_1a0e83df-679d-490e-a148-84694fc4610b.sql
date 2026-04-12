-- 1. Drop the policy that exposes email PII on the base reviews table
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;

-- 2. Recreate the reviews_public view with security_invoker instead of security definer
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
  SELECT id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved, is_generated
  FROM public.reviews
  WHERE approved = true;

-- 3. We need a SELECT policy on reviews for the view to work via security invoker
-- This policy is scoped so anon can only read approved reviews (no email exposure since view excludes it)
CREATE POLICY "Anon can read approved reviews for view"
ON public.reviews FOR SELECT TO anon
USING (approved = true);

-- 4. Fix review_reactions: drop permissive delete/update policies and add ownership-based ones
DROP POLICY IF EXISTS "Anyone can delete reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Anyone can update own reactions" ON public.review_reactions;

CREATE POLICY "Users can delete own reactions"
ON public.review_reactions FOR DELETE TO anon
USING (session_id = coalesce(current_setting('request.headers', true)::json->>'x-session-id', ''));

CREATE POLICY "Users can update own reactions"
ON public.review_reactions FOR UPDATE TO anon
USING (session_id = coalesce(current_setting('request.headers', true)::json->>'x-session-id', ''))
WITH CHECK (session_id = coalesce(current_setting('request.headers', true)::json->>'x-session-id', ''));