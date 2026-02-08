-- Add language column to chat_messages for per-message language detection
ALTER TABLE public.chat_messages ADD COLUMN language text DEFAULT NULL;

-- Add status column for flagging (flagged, approved, pending_review)
ALTER TABLE public.chat_messages ADD COLUMN status text DEFAULT 'approved';