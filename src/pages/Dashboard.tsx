import { useState, useEffect, useMemo } from "react";
import { MessageSquare, Users, Clock, Search, Filter, LogOut, Sparkles, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import ReviewCard from "@/components/dashboard/ReviewCard";
import SentimentResult from "@/components/dashboard/SentimentResult";
import StatsDetail from "@/components/dashboard/StatsDetail";
import ReviewChat from "@/components/dashboard/ReviewChat";
import SentimentChart from "@/components/dashboard/SentimentChart";
import ConversationsList from "@/components/dashboard/ConversationsList";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAIReviewSort } from "@/hooks/useAIReviewSort";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ViewState = 
  | { type: "dashboard" }
  | { type: "sentiment"; review: Review }
  | { type: "stats"; statsType: "comments" | "customers" | "response" };

const Dashboard = () => {
  const [view, setView] = useState<ViewState>({ type: "dashboard" });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const [sortedReviews, setSortedReviews] = useState<Review[]>([]);
  const [isAISorted, setIsAISorted] = useState(false);
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const { data: reviews = [], refetch } = useReviews();
  const { sortReviewsByRelevance, isSorting, error: sortError } = useAIReviewSort();

  // Update sorted reviews when reviews change
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
    if (!sortError) {
      toast.success("Reviews sorted by AI relevance");
    }
  };

  const resetSort = () => {
    setSortedReviews(reviews);
    setIsAISorted(false);
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/pv-admin");
    }
  };

  const handleAnalyze = async (review: Review) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          reviews: [review],
          action: "analyze-sentiment",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze sentiment");
      }

      const { sentiment } = await response.json();
      
      const { error } = await supabase
        .from("reviews")
        .update({ sentiment })
        .eq("id", review.id);
      
      if (error) {
        toast.error("Failed to save analysis");
        return;
      }
      
      refetch();
      
      const analyzedReview = { ...review, sentiment };
      setView({ type: "sentiment", review: analyzedReview });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze review");
    }
  };

  const handleStatsClick = (statsType: "comments" | "customers" | "response") => {
    setView({ type: "stats", statsType });
  };

  const reviewsToFilter = isAISorted ? sortedReviews : reviews;
  const filteredReviews = reviewsToFilter.filter(review => {
    const matchesSearch = review.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterSentiment || review.sentiment === filterSentiment;
    return matchesSearch && matchesFilter;
  });

  const uniqueCustomers = new Set(reviews.map(r => r.name)).size;

  const sentimentData = useMemo(() => {
    const positive = reviews.filter(r => r.sentiment === "positive").length;
    const negative = reviews.filter(r => r.sentiment === "negative").length;
    const neutral = reviews.filter(r => r.sentiment === "neutral").length;
    const unanalyzed = reviews.filter(r => !r.sentiment).length;
    return { positive, negative, neutral, unanalyzed, total: reviews.length };
  }, [reviews]);

  if (view.type === "sentiment") {
    return <SentimentResult comment={{
      id: view.review.id,
      customerName: view.review.name,
      customerEmail: "",
      content: view.review.feedback,
      timestamp: view.review.created_at,
      sentiment: view.review.sentiment as "positive" | "negative" | "neutral" | undefined
    }} onBack={() => setView({ type: "dashboard" })} />;
  }

  if (view.type === "stats") {
    const commentsForStats = reviews.map(r => ({
      id: r.id,
      customerName: r.name,
      customerEmail: "",
      content: r.feedback,
      timestamp: r.created_at,
      sentiment: r.sentiment as "positive" | "negative" | "neutral" | undefined
    }));
    return <StatsDetail type={view.statsType} comments={commentsForStats} onBack={() => setView({ type: "dashboard" })} />;
  }

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay">
      <DashboardHeader />
      
      {/* User bar */}
      <div className="border-b-2 border-border bg-card/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Logged in as <span className="text-foreground font-semibold">{user?.email}</span>
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl border-2 font-semibold">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <main className="container mx-auto px-6 py-10">
        {/* Stats Section */}
        <section className="mb-12">
          <h2 className="text-xl font-display font-bold text-foreground mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              title="Total Reviews"
              value={reviews.length}
              icon={MessageSquare}
              trend="up"
              trendValue="+12%"
              description="vs last week"
              onClick={() => handleStatsClick("comments")}
            />
            <StatsCard
              title="Unique Customers"
              value={uniqueCustomers}
              icon={Users}
              trend="up"
              trendValue="+8%"
              description="vs last week"
              onClick={() => handleStatsClick("customers")}
            />
            <StatsCard
              title="Avg. Response Time"
              value="2.5m"
              icon={Clock}
              trend="down"
              trendValue="-15%"
              description="faster than usual"
              onClick={() => handleStatsClick("response")}
            />
          </div>
        </section>

        {/* Conversations and Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <ConversationsList />
          <SentimentChart 
            sentimentData={sentimentData}
            filterSentiment={filterSentiment}
            onFilterChange={setFilterSentiment}
          />
        </div>

        {/* Reviews Section */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-display font-bold text-foreground">Customer Reviews</h2>
              {isAISorted && (
                <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Sorted
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant={isAISorted ? "secondary" : "outline"}
                size="sm"
                onClick={isAISorted ? resetSort : handleAISort}
                disabled={isSorting || reviews.length === 0}
                className="rounded-xl border-2 font-semibold"
              >
                {isSorting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                {isAISorted ? "Reset Sort" : "AI Sort"}
              </Button>
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 w-full sm:w-72 rounded-xl border-2"
                />
              </div>
              {filterSentiment && (
                <Button variant="ghost" size="sm" onClick={() => setFilterSentiment(null)} className="rounded-xl font-semibold">
                  <Filter className="w-4 h-4 mr-1.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onAnalyze={handleAnalyze}
                />
              ))
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border-2 border-border shadow-subtle">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-display text-lg">No reviews found matching your criteria.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* AI Review Chat Widget - for admin analysis */}
      <ReviewChat reviews={reviews} />
    </div>
  );
};

export default Dashboard;
