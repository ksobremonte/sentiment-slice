
-- Fix 1: Restrict reviews SELECT to authenticated users only (public uses reviews_public view)
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Authenticated users can read reviews"
ON public.reviews FOR SELECT
USING (is_authenticated_user());

-- Fix 2: Remove public UPDATE on chat_conversations (edge function uses service_role, admin is authenticated)
DROP POLICY IF EXISTS "Public can update conversations" ON public.chat_conversations;

-- Fix 3: Restrict public SELECT on chat_conversations to own session only
DROP POLICY IF EXISTS "Public can read conversations" ON public.chat_conversations;
CREATE POLICY "Public can read own conversations"
ON public.chat_conversations FOR SELECT
USING (true);
-- Note: We keep USING(true) for SELECT because the customer widget needs to read 
-- its conversation by session_id. The widget only queries with .eq("session_id", sessionId).
-- However, to truly restrict, we scope to session_id matching. But since session_id comes 
-- from the client, the real protection is that conversations don't contain sensitive data.
-- The authenticated policy already covers admin access.

-- Actually, let's be more restrictive: remove the public read entirely 
-- and rely on the edge function (service_role) for customer reads
DROP POLICY IF EXISTS "Public can read own conversations" ON public.chat_conversations;

-- Fix 4: Restrict public SELECT on chat_messages to prevent reading all conversations
DROP POLICY IF EXISTS "Public can read messages" ON public.chat_messages;
