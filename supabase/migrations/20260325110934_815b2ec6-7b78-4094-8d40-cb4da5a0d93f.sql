-- Swap dates: Feb 2026 reviews become March, March reviews become February
-- Step 1: Move Feb reviews to temp April range
UPDATE public.reviews
SET created_at = created_at + interval '2 months'
WHERE created_at >= '2026-02-01' AND created_at < '2026-03-01';

-- Step 2: Move March reviews to February
UPDATE public.reviews
SET created_at = created_at - interval '1 month'
WHERE created_at >= '2026-03-01' AND created_at < '2026-04-01';

-- Step 3: Move temp April reviews to March
UPDATE public.reviews
SET created_at = created_at - interval '1 month'
WHERE created_at >= '2026-04-01' AND created_at < '2026-05-01';