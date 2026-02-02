import { User, Star, Check, X, Globe, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PendingReviewCardProps {
  review: Review;
  onApprove: (review: Review) => void;
  onReject: (review: Review) => void;
  isProcessing: boolean;
}

const PendingReviewCard = ({ review, onApprove, onReject, isProcessing }: PendingReviewCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  const getLanguageLabel = (code: string | null) => {
    if (!code) return "Unknown";
    const languages: Record<string, string> = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
    };
    return languages[code.toLowerCase()] || code.toUpperCase();
  };

  return (
    <div className="bg-card border-2 border-warning/50 rounded-2xl p-6 transition-all duration-300 hover:border-warning hover:shadow-card animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h4 className="font-display font-semibold text-lg text-foreground">{review.name}</h4>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-warning/10 text-warning">
                Pending Review
              </span>
              {review.language && review.language !== "en" && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {getLanguageLabel(review.language)}
                </span>
              )}
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
            
            <p className="text-xs text-muted-foreground mt-4">{timeAgo}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApprove(review)}
            disabled={isProcessing}
            className="rounded-xl border-2 font-semibold border-success text-success hover:bg-success hover:text-success-foreground"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="rounded-xl border-2 font-semibold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The review from "{review.name}" will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onReject(review)}
                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Review
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default PendingReviewCard;
