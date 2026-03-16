import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, Filter, Sparkles, Loader2, Star } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReviewCard from "@/components/dashboard/ReviewCard";
import SentimentResult from "@/components/dashboard/SentimentResult";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAIReviewSort } from "@/hooks/useAIReviewSort";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const REVIEWS_PER_PAGE = 10;

const DashboardReviews = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [sortedReviews, setSortedReviews] = useState<Review[]>([]);
  const [isAISorted, setIsAISorted] = useState(false);
  const [page, setPage] = useState(1);
  const [sentimentView, setSentimentView] = useState<Review | null>(null);
  const { data: reviews = [], refetch } = useReviews();
  const { sortReviewsByRelevance, isSorting, error: sortError } = useAIReviewSort();

  useEffect(() => {
    if (reviews.length > 0 && !isAISorted) {
      setSortedReviews(reviews);
    }
  }, [reviews, isAISorted]);

  const handleAISort = async () => {
    if (reviews.length === 0) return;
    const sorted = await sortReviewsByRelevance(reviews);
    setSortedReviews(sorted);
    setIsAISorted(true);
    if (!sortError) toast.success("Reviews sorted by AI relevance");
  };

  const resetSort = () => {
    setSortedReviews(reviews);
    setIsAISorted(false);
  };

  const handleAnalyze = async (review: Review) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ reviews: [review], action: "analyze-sentiment" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze sentiment");
      }

      const { sentiment, reasoning, keyPhrases } = await response.json();
      const { error } = await supabase
        .from("reviews")
        .update({
          sentiment,
          sentiment_reason: reasoning || null,
          sentiment_keywords: keyPhrases || null,
        })
        .eq("id", review.id);
      if (error) { toast.error("Failed to save analysis"); return; }

      refetch();
      setSentimentView({ ...review, sentiment, sentiment_reason: reasoning || null, sentiment_keywords: keyPhrases || null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze review");
    }
  };

  const handleDelete = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw error;
      toast.success("Review deleted permanently");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    }
  }, [refetch]);

  const reviewsToFilter = isAISorted ? sortedReviews : reviews;
  const filteredReviews = reviewsToFilter.filter((review) => {
    const matchesSearch =
      review.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterSentiment || review.sentiment === filterSentiment;
    const matchesRating = filterRating === "all" || review.rating === Number(filterRating);
    return matchesSearch && matchesFilter && matchesRating;
  });

  const totalPages = Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE);
  const paginatedReviews = filteredReviews.slice((page - 1) * REVIEWS_PER_PAGE, page * REVIEWS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchQuery, filterSentiment, filterRating, isAISorted]);

  if (sentimentView) {
    return (
      <DashboardLayout>
        <SentimentResult
          comment={{
            id: sentimentView.id,
            customerName: sentimentView.name,
            customerEmail: "",
            content: sentimentView.feedback,
            timestamp: sentimentView.created_at,
            sentiment: sentimentView.sentiment as "positive" | "negative" | "neutral" | undefined,
          }}
          sentimentReason={sentimentView.sentiment_reason}
          sentimentKeywords={sentimentView.sentiment_keywords}
          onBack={() => setSentimentView(null)}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-xl font-display font-bold text-foreground">Customer Reviews</h2>
          {isAISorted && (
            <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI Sorted
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant={isAISorted ? "secondary" : "outline"}
            size="sm"
            onClick={isAISorted ? resetSort : handleAISort}
            disabled={isSorting || reviews.length === 0}
            className="rounded-xl border-2 font-semibold"
          >
            {isSorting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            {isAISorted ? "Reset Sort" : "AI Sort"}
          </Button>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-40 rounded-xl border-2">
              <Star className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-xl border-2"
            />
          </div>
          {(filterSentiment || filterRating !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterSentiment(null); setFilterRating("all"); }} className="rounded-xl font-semibold">
              <Filter className="w-4 h-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {paginatedReviews.length > 0 ? (
          paginatedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} onAnalyze={handleAnalyze} onViewSentiment={(r) => setSentimentView(r)} onDelete={handleDelete} />
          ))
        ) : (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-border shadow-subtle">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-display text-lg">No reviews found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
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
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border-2 font-semibold"
          >
            Next
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardReviews;
