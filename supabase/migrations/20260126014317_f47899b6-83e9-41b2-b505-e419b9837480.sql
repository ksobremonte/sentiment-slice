-- Add receipt_number and photo_url columns to reviews table (nullable for existing records)
ALTER TABLE public.reviews 
ADD COLUMN receipt_number text,
ADD COLUMN photo_url text;

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true);

-- Allow anyone to upload review photos
CREATE POLICY "Anyone can upload review photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'review-photos');

-- Allow public read access to review photos
CREATE POLICY "Review photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'review-photos');

-- Update the reviews_public view to include new columns
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public AS
SELECT 
  id,
  name,
  rating,
  feedback,
  sentiment,
  created_at,
  receipt_number,
  photo_url
FROM public.reviews;