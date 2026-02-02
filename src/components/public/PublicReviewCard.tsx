import { Star, User, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicReview } from "@/hooks/usePublicReviews";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PublicReviewCardProps {
  review: PublicReview;
}

const PublicReviewCard = ({ review }: PublicReviewCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-card animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h4 className="font-display font-semibold text-lg text-foreground">{review.name}</h4>
          </div>
          
          {/* Star Rating */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-5 h-5",
                  star <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          
          <p className="text-foreground leading-relaxed">{review.feedback}</p>
          
          {/* Photo Preview */}
          {review.photo_url && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  <ImageIcon className="w-4 h-4" />
                  View photo
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card">
                <img
                  src={review.photo_url}
                  alt="Review attachment"
                  className="w-full rounded-xl"
                />
              </DialogContent>
            </Dialog>
          )}
          
          <p className="text-xs text-muted-foreground mt-4">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicReviewCard;
