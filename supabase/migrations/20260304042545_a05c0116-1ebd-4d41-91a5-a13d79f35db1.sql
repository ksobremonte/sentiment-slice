
-- FIX 1: Remove public SELECT policy on reviews table that exposes email addresses
-- Anonymous users should ONLY access reviews through the reviews_public view
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;

-- FIX 2: Remove unrestricted public INSERT policies on chat tables
-- Chat creation should only happen through the customer-chat edge function (service_role)
DROP POLICY IF EXISTS "Public can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Public can create messages" ON public.chat_messages;

-- Replace with service_role-only INSERT policies for edge functions
CREATE POLICY "Service role can create conversations"
ON public.chat_conversations FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can create messages"
ON public.chat_messages FOR INSERT
TO service_role
WITH CHECK (true);
