import { Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Comment {
  id: string;
  customerName: string;
  customerEmail: string;
  content: string;
  timestamp: string;
  sentiment?: "positive" | "negative" | "neutral";
}

interface CommentCardProps {
  comment: Comment;
  onAnalyze: (comment: Comment) => void;
}

const CommentCard = ({ comment, onAnalyze }: CommentCardProps) => {
  const getSentimentStyles = () => {
    if (!comment.sentiment) return "";
    
    switch (comment.sentiment) {
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
              <h4 className="font-semibold text-foreground">{comment.customerName}</h4>
              {comment.sentiment && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  comment.sentiment === "positive" && "bg-success/10 text-success",
                  comment.sentiment === "negative" && "bg-destructive/10 text-destructive",
                  comment.sentiment === "neutral" && "bg-warning/10 text-warning"
                )}>
                  {comment.sentiment.charAt(0).toUpperCase() + comment.sentiment.slice(1)}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{comment.customerEmail}</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
            <p className="text-xs text-muted-foreground/70 mt-3">{comment.timestamp}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAnalyze(comment)}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4 mr-1" />
          Analyze
        </Button>
      </div>
    </div>
  );
};

export default CommentCard;
