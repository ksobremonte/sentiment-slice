import { Star, MessageSquare, Loader2 } from "lucide-react";
import { usePublicReviews } from "@/hooks/usePublicReviews";
import PublicReviewCard from "./PublicReviewCard";

const PublicReviewsList = () => {
  const { data: reviews = [], isLoading } = usePublicReviews();

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
    <div className="space-y-8">
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
        <p className="text-muted-foreground">{reviews.length} happy customer{reviews.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4">
        {reviews.map((review) => (
          <PublicReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default PublicReviewsList;
