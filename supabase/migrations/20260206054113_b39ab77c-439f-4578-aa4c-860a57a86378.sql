-- Add admin_response column to reviews table
ALTER TABLE public.reviews 
ADD COLUMN admin_response text,
ADD COLUMN admin_response_at timestamp with time zone;