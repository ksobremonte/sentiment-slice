import { useMemo } from "react";
import { Hash } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";

interface KeywordCloudProps {
  reviews: Review[];
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had",
  "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "can", "need", "dare", "ought", "used", "i", "you", "he", "she", "it",
  "we", "they", "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "been", "being", "each", "few", "more", "most", "other", "some", "such",
  "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "also", "now", "here", "there", "when", "where", "why", "how", "all", "any",
  "both", "into", "through", "during", "before", "after", "above", "below", "up",
  "down", "out", "off", "over", "under", "again", "further", "then", "once", "my",
  "your", "our", "their", "its", "if", "because", "about", "get", "got", "really",
  "even", "made", "make", "still", "way", "well", "back", "much", "go", "going",
  "went", "come", "came", "like", "liked", "just", "order", "ordered", "one", "two",
  "three", "first", "time", "times", "day", "days", "place", "would", "could"
]);

// Keywords that indicate specific aspects
const ASPECT_KEYWORDS: Record<string, string[]> = {
  food: ["pizza", "pasta", "cheese", "crust", "sauce", "toppings", "pepperoni", "mushroom", "delicious", "tasty", "flavor", "fresh", "hot", "cold", "overcooked", "undercooked", "bland", "seasoning", "portion", "size"],
  service: ["staff", "waiter", "waitress", "server", "friendly", "rude", "attentive", "slow", "fast", "helpful", "manager", "service", "wait", "waiting"],
  value: ["price", "expensive", "cheap", "affordable", "worth", "value", "money", "cost", "overpriced", "reasonable", "budget"],
  experience: ["atmosphere", "ambiance", "clean", "dirty", "cozy", "noisy", "quiet", "comfortable", "crowded", "nice", "pleasant", "recommend", "return", "visit", "love", "hate", "amazing", "terrible", "best", "worst", "great", "bad", "good", "excellent", "poor"]
};

const KeywordCloud = ({ reviews }: KeywordCloudProps) => {
  const keywords = useMemo(() => {
    if (reviews.length === 0) return [];

    // Extract words from all feedback
    const wordCounts: Record<string, { count: number; sentiment: string }> = {};
    
    reviews.forEach(review => {
      const words = review.feedback
        .toLowerCase()
        .replace(/[^\w\s]/g, "") // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word));
      
      const sentiment = review.sentiment || "neutral";
      
      words.forEach(word => {
        if (!wordCounts[word]) {
          wordCounts[word] = { count: 0, sentiment: "neutral" };
        }
        wordCounts[word].count++;
        // Use the most recent sentiment for this word
        wordCounts[word].sentiment = sentiment;
      });
    });

    // Sort by count and take top 20
    return Object.entries(wordCounts)
      .filter(([_, data]) => data.count >= 2) // At least 2 mentions
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiment,
        // Determine aspect
        aspect: Object.entries(ASPECT_KEYWORDS).find(([_, keywords]) => 
          keywords.includes(word)
        )?.[0] || null
      }));
  }, [reviews]);

  const maxCount = Math.max(...keywords.map(k => k.count), 1);

  const getKeywordStyle = (keyword: typeof keywords[0]) => {
    const sizeScale = 0.7 + (keyword.count / maxCount) * 0.6; // Scale from 0.7 to 1.3
    
    let colorClass = "bg-secondary text-secondary-foreground";
    if (keyword.sentiment === "positive") colorClass = "bg-success/10 text-success border-success/30";
    else if (keyword.sentiment === "negative") colorClass = "bg-destructive/10 text-destructive border-destructive/30";
    else if (keyword.sentiment === "neutral") colorClass = "bg-warning/10 text-warning border-warning/30";
    
    return { sizeScale, colorClass };
  };

  const aspectCounts = useMemo(() => {
    const counts = { food: 0, service: 0, value: 0, experience: 0 };
    keywords.forEach(k => {
      if (k.aspect && k.aspect in counts) {
        counts[k.aspect as keyof typeof counts] += k.count;
      }
    });
    return counts;
  }, [keywords]);

  return (
    <section className="mb-10">
      <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <Hash className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-display font-bold text-foreground">Keyword Frequency</h3>
        </div>
        
        {keywords.length > 0 ? (
          <>
            {/* Keyword Cloud */}
            <div className="flex flex-wrap gap-2 mb-6">
              {keywords.map((keyword) => {
                const { sizeScale, colorClass } = getKeywordStyle(keyword);
                return (
                  <span
                    key={keyword.word}
                    className={cn(
                      "px-3 py-1.5 rounded-full border font-medium transition-transform hover:scale-105 cursor-default",
                      colorClass
                    )}
                    style={{ fontSize: `${sizeScale}rem` }}
                    title={`${keyword.word}: ${keyword.count} mentions${keyword.aspect ? ` (${keyword.aspect})` : ""}`}
                  >
                    {keyword.word}
                    <span className="ml-1.5 opacity-60 text-xs">({keyword.count})</span>
                  </span>
                );
              })}
            </div>

            {/* Aspect Summary */}
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground mb-4">Aspect-Based Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold text-primary">{aspectCounts.food}</p>
                  <p className="text-xs text-muted-foreground mt-1">Food Mentions</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold text-accent">{aspectCounts.service}</p>
                  <p className="text-xs text-muted-foreground mt-1">Service Mentions</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold text-success">{aspectCounts.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">Value Mentions</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-display font-bold text-warning">{aspectCounts.experience}</p>
                  <p className="text-xs text-muted-foreground mt-1">Experience Mentions</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            <p className="font-display text-lg">No keywords extracted yet</p>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-6 bg-muted/50 rounded-xl p-4">
          🔍 Keywords are automatically extracted from customer feedback. Larger text indicates higher frequency. Colors show associated sentiment.
        </p>
      </div>
    </section>
  );
};

export default KeywordCloud;
