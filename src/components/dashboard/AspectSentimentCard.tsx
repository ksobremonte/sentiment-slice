import { UtensilsCrossed, UserCheck, DollarSign, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AspectData {
  food: string;
  service: string;
  value: string;
  experience: string;
}

interface AspectSentimentCardProps {
  aspects: AspectData;
  confidence?: number;
  keyPhrases?: string[];
  ratingAlignment?: boolean;
}

const AspectSentimentCard = ({ aspects, confidence, keyPhrases, ratingAlignment }: AspectSentimentCardProps) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-success bg-success/10";
      case "negative":
        return "text-destructive bg-destructive/10";
      case "neutral":
        return "text-warning bg-warning/10";
      default:
        return "text-muted-foreground bg-muted/50";
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    if (sentiment === "not_mentioned") return "—";
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  const aspectItems = [
    { key: "food", icon: UtensilsCrossed, label: "Food", value: aspects.food },
    { key: "service", icon: UserCheck, label: "Service", value: aspects.service },
    { key: "value", icon: DollarSign, label: "Value", value: aspects.value },
    { key: "experience", icon: Sparkles, label: "Experience", value: aspects.experience },
  ];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aspect Analysis</span>
        {confidence !== undefined && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            confidence >= 0.8 ? "bg-success/10 text-success" :
            confidence >= 0.5 ? "bg-warning/10 text-warning" :
            "bg-destructive/10 text-destructive"
          )}>
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
        {ratingAlignment === false && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
            Rating mismatch
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {aspectItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                getSentimentColor(item.value)
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{item.label}:</span>
              <span className="opacity-80">{getSentimentLabel(item.value)}</span>
            </div>
          );
        })}
      </div>

      {keyPhrases && keyPhrases.length > 0 && (
        <div className="mt-3">
          <span className="text-xs text-muted-foreground">Key phrases: </span>
          {keyPhrases.map((phrase, i) => (
            <span key={i} className="text-xs text-foreground">
              "{phrase}"{i < keyPhrases.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AspectSentimentCard;
