-- Create chat_conversations table to track conversation threads
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'pending_admin'))
);

-- Create chat_messages table to store all messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_complaint BOOLEAN DEFAULT false,
  sentiment TEXT
);

-- Add conversation_id to reviews table to link complaints to conversations
ALTER TABLE public.reviews 
ADD COLUMN conversation_id UUID REFERENCES public.chat_conversations(id);

-- Enable RLS on new tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Public can create conversations and messages (for chatbot)
CREATE POLICY "Public can create conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read conversations"
ON public.chat_conversations FOR SELECT
USING (true);

CREATE POLICY "Public can update conversations"
ON public.chat_conversations FOR UPDATE
USING (true);

CREATE POLICY "Public can create messages"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can read messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Authenticated users can manage all
CREATE POLICY "Authenticated users can manage conversations"
ON public.chat_conversations FOR ALL
USING (is_authenticated_user());

CREATE POLICY "Authenticated users can manage messages"
ON public.chat_messages FOR ALL
USING (is_authenticated_user());

-- Enable realtime for chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update conversation when new message arrives
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Index for faster lookups
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_reviews_conversation ON public.reviews(conversation_id);