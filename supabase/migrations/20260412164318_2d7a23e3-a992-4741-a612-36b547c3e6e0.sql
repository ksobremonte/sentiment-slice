-- Drop the header-based policies (they're fragile with the JS client)
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Users can update own reactions" ON public.review_reactions;

-- Deny direct delete/update for anon
CREATE POLICY "Deny anon delete reactions"
ON public.review_reactions FOR DELETE TO anon
USING (false);

CREATE POLICY "Deny anon update reactions"
ON public.review_reactions FOR UPDATE TO anon
USING (false);

-- Create RPC functions for ownership-verified delete and update
CREATE OR REPLACE FUNCTION public.delete_own_reaction(p_id uuid, p_session_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.review_reactions WHERE id = p_id AND session_id = p_session_id;
$$;

CREATE OR REPLACE FUNCTION public.update_own_reaction(p_id uuid, p_session_id text, p_reaction text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.review_reactions SET reaction = p_reaction WHERE id = p_id AND session_id = p_session_id;
$$;