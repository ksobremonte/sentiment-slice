-- Ensure proper access controls on reviews_public view
-- First revoke from public/anon to ensure no anonymous access
REVOKE ALL ON public.reviews_public FROM anon;
REVOKE ALL ON public.reviews_public FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.reviews_public TO authenticated;