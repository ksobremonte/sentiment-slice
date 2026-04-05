ALTER TABLE public.chat_conversations 
  ADD COLUMN has_admin_replied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN ai_auto_enabled BOOLEAN NOT NULL DEFAULT true;