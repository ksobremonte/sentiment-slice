import { useState, useMemo, useEffect } from "react";
import { Star, MessageSquare, Loader2, ArrowUpDown } from "lucide-react";
import { usePublicReviews } from "@/hooks/usePublicReviews";
import PublicReviewCard from "./PublicReviewCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortOption = "latest" | "highest" | "lowest";
const REVIEWS_PER_PAGE = 8;

const PublicReviewsList = () => {
  const { data: reviews = [], isLoading } = usePublicReviews();
  const [sort, setSort] = useState<SortOption>("latest");
  const [page, setPage] = useState(1);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sort) {
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [reviews, sort]);

  const totalPages = Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = sortedReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  // Reset page when sort changes
  useEffect(() => { setPage(1); }, [sort]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-card animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => <div key={s} className="w-4 h-4 bg-muted rounded" />)}
                </div>
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
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
    <div className="space-y-6">
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
        {paginatedReviews.map((review) => (
          <PublicReviewCard key={review.id} review={review} />
        ))}
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
