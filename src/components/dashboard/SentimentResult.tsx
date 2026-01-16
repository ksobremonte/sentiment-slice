import { ArrowLeft, ThumbsUp, ThumbsDown, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Comment } from "./CommentCard";

interface SentimentResultProps {
  comment: Comment;
  onBack: () => void;
}

const SentimentResult = ({ comment, onBack }: SentimentResultProps) => {
  const getSentimentData = () => {
    switch (comment.sentiment) {
      case "positive":
        return {
          icon: ThumbsUp,
          title: "Positive Sentiment",
          description: "This customer feedback expresses satisfaction and positive emotions.",
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success",
          gradientFrom: "from-success/20",
        };
      case "negative":
        return {
          icon: ThumbsDown,
          title: "Negative Sentiment",
          description: "This customer feedback indicates dissatisfaction or concerns.",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive",
          gradientFrom: "from-destructive/20",
        };
      default:
        return {
          icon: Minus,
          title: "Neutral Sentiment",
          description: "This customer feedback is balanced without strong positive or negative emotions.",
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning",
          gradientFrom: "from-warning/20",
        };
    }
  };

  const sentimentData = getSentimentData();
  const Icon = sentimentData.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className={cn(
            "relative overflow-hidden rounded-2xl border-2 p-8 animate-scale-in",
            sentimentData.borderColor,
            sentimentData.bgColor
          )}>
            {/* Background gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br to-transparent opacity-50",
              sentimentData.gradientFrom
            )} />

            <div className="relative z-10">
              {/* Sentiment Icon */}
              <div className="flex justify-center mb-6">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center animate-float",
                  sentimentData.bgColor
                )}>
                  <Icon className={cn("w-12 h-12", sentimentData.color)} />
                </div>
              </div>

              {/* Sentiment Title */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">AI Analysis Result</span>
                </div>
                <h2 className={cn("text-3xl font-bold mb-2", sentimentData.color)}>
                  {sentimentData.title}
                </h2>
                <p className="text-muted-foreground">{sentimentData.description}</p>
              </div>

              {/* Original Comment */}
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Original Comment</h3>
                <div className="mb-4">
                  <p className="font-semibold text-foreground">{comment.customerName}</p>
                  <p className="text-xs text-muted-foreground">{comment.customerEmail}</p>
                </div>
                <p className="text-foreground/90 leading-relaxed italic">"{comment.content}"</p>
                <p className="text-xs text-muted-foreground/70 mt-4">{comment.timestamp}</p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button variant="outline" onClick={onBack}>
                  Analyze Another
                </Button>
                <Button variant="default">
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentResult;
