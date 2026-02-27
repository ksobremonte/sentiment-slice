
-- Recreate the reviews_public view with security_definer so anonymous users can access it
DROP VIEW IF EXISTS public.reviews_public;

CREATE VIEW public.reviews_public
WITH (security_barrier=true) AS
SELECT id, name, rating, feedback, sentiment, created_at, photo_url, language, approved
FROM public.reviews
WHERE approved = true;

-- Use ALTER VIEW to set the security_invoker to false (security_definer behavior)
ALTER VIEW public.reviews_public SET (security_invoker = false);

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;
