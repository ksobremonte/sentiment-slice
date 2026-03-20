import { Star, User, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicReview } from "@/hooks/usePublicReviews";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
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
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-xl p-5 shadow-card"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-semibold text-foreground">{review.name}</h4>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <div className="flex gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed">{review.feedback}</p>
          
          {review.photo_url && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-3 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <img
                    src={review.photo_url}
                    alt="Review attachment"
                    className="w-32 h-24 object-cover"
                  />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card">
                <img src={review.photo_url} alt="Review attachment" className="w-full rounded-xl" />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PublicReviewCard;
