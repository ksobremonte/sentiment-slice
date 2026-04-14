import { useState, useMemo, useEffect, useRef } from "react";
import { Star, MessageSquare, Loader2, ArrowUpDown } from "lucide-react";
import { usePublicReviews } from "@/hooks/usePublicReviews";
import { useReviewReactions } from "@/hooks/useReviewReactions";
import PublicReviewCard from "./PublicReviewCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortOption = "latest" | "highest" | "lowest";
const REVIEWS_PER_PAGE = 15;

const PublicReviewsList = () => {
  const { data: reviews = [], isLoading } = usePublicReviews();
  const [sort, setSort] = useState<SortOption>("latest");
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const reviewIds = useMemo(() => reviews.map((r) => r.id), [reviews]);
  const { getCounts, getUserReaction, toggleReaction } = useReviewReactions(reviewIds);

  const handleReact = (reviewId: string, reaction: "like" | "dislike") => {
    toggleReaction.mutate({ reviewId, reaction });
  };

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    const byDate = (a: typeof reviews[0], b: typeof reviews[0]) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    
    // Always keep real reviews before generated ones
    const byGenerated = (a: typeof reviews[0], b: typeof reviews[0]) =>
      (a.is_generated ? 1 : 0) - (b.is_generated ? 1 : 0);

    switch (sort) {
      case "highest":
        return sorted.sort((a, b) => byGenerated(a, b) || b.rating - a.rating || byDate(a, b));
      case "lowest":
        return sorted.sort((a, b) => byGenerated(a, b) || a.rating - b.rating || byDate(a, b));
      default:
        return sorted.sort((a, b) => byGenerated(a, b) || byDate(a, b));
    }
  }, [reviews, sort]);

  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = sortedReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  // Reset page when sort changes
  useEffect(() => { setPage(1); }, [sort]);

  // Scroll to top of reviews container on page change
  useEffect(() => {
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 bg-card rounded-2xl border-2 border-border shadow-subtle">
        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-display text-lg">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Summary */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-subtle text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-6 h-6 ${star <= Math.round(avgRating) ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="text-2xl font-display font-bold text-foreground">{avgRating.toFixed(1)} out of 5</p>
        <p className="text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-end gap-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-48 rounded-xl border-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="highest">Highest Rating</SelectItem>
            <SelectItem value="lowest">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="grid gap-4">
        {paginatedReviews.map((review) => {
          const counts = getCounts(review.id);
          return (
            <PublicReviewCard
              key={review.id}
              review={review}
              likes={counts.likes}
              dislikes={counts.dislikes}
              userReaction={getUserReaction(review.id)}
              onReact={handleReact}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2 font-semibold"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-semibold px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border-2 font-semibold"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicReviewsList;
