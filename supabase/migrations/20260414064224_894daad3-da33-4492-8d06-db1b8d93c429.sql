-- Remove duplicate user messages, keeping only the first one
DELETE FROM chat_messages 
WHERE id IN ('7a7468e9-9c41-4726-a864-1937c6f0a405', 'ee305947-1252-4d04-bf4c-dff0cd4601f2');