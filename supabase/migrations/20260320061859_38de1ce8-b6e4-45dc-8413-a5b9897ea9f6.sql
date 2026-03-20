
-- Create review_reactions table for public like/dislike on reviews
CREATE TABLE public.review_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (review_id, session_id)
);

-- Enable RLS
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions (public counts)
CREATE POLICY "Anyone can read reactions"
  ON public.review_reactions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert reactions (anonymous customers)
CREATE POLICY "Anyone can insert reactions"
  ON public.review_reactions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update their own reaction (change like to dislike)
CREATE POLICY "Anyone can update own reactions"
  ON public.review_reactions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Anyone can delete own reactions (un-react)
CREATE POLICY "Anyone can delete reactions"
  ON public.review_reactions FOR DELETE
  TO anon, authenticated
  USING (true);
