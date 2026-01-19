import { Send, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  review: Review;
  onAnalyze: (review: Review) => void;
}

const ReviewCard = ({ review, onAnalyze }: ReviewCardProps) => {
  const getSentimentStyles = () => {
    if (!review.sentiment) return "";
    
    switch (review.sentiment) {
      case "positive":
        return "border-l-4 border-l-success";
      case "negative":
        return "border-l-4 border-l-destructive";
      case "neutral":
        return "border-l-4 border-l-warning";
      default:
        return "";
    }
  };

  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:border-primary/30 animate-fade-in",
      getSentimentStyles()
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{review.name}</h4>
              {review.sentiment && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  review.sentiment === "positive" && "bg-success/10 text-success",
                  review.sentiment === "negative" && "bg-destructive/10 text-destructive",
                  review.sentiment === "neutral" && "bg-warning/10 text-warning"
                )}>
                  {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{review.email}</p>
            
            {/* Star Rating */}
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            
            <p className="text-sm text-foreground/90 leading-relaxed">{review.feedback}</p>
            <p className="text-xs text-muted-foreground/70 mt-3">{timeAgo}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAnalyze(review)}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4 mr-1" />
          Analyze
        </Button>
      </div>
    </div>
  );
};

export default ReviewCard;
