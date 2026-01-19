import { useState } from "react";
import { MessageSquare, Users, Clock, Search, Filter, LogOut } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCard from "@/components/dashboard/StatsCard";
import ReviewCard from "@/components/dashboard/ReviewCard";
import SentimentResult from "@/components/dashboard/SentimentResult";
import StatsDetail from "@/components/dashboard/StatsDetail";
import { useReviews, Review } from "@/hooks/useReviews";
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
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const { data: reviews = [], refetch } = useReviews();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/login");
    }
  };

  const handleAnalyze = async (review: Review) => {
    // Simulate AI analysis - in real app, this would call an AI API
    const sentiments = ["positive", "negative", "neutral"] as const;
    const analyzedSentiment = review.sentiment || sentiments[Math.floor(Math.random() * 3)];
    
    // Update the review in the database
    const { error } = await supabase
      .from("reviews")
      .update({ sentiment: analyzedSentiment })
      .eq("id", review.id);
    
    if (error) {
      toast.error("Failed to save analysis");
      return;
    }
    
    refetch();
    
    const analyzedReview = { ...review, sentiment: analyzedSentiment };
    setView({ type: "sentiment", review: analyzedReview });
  };

  const handleStatsClick = (statsType: "comments" | "customers" | "response") => {
    setView({ type: "stats", statsType });
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterSentiment || review.sentiment === filterSentiment;
    return matchesSearch && matchesFilter;
  });

  const uniqueCustomers = new Set(reviews.map(r => r.email)).size;

  if (view.type === "sentiment") {
    return <SentimentResult comment={{
      id: view.review.id,
      customerName: view.review.name,
      customerEmail: view.review.email,
      content: view.review.feedback,
      timestamp: view.review.created_at,
      sentiment: view.review.sentiment as "positive" | "negative" | "neutral" | undefined
    }} onBack={() => setView({ type: "dashboard" })} />;
  }

  if (view.type === "stats") {
    const commentsForStats = reviews.map(r => ({
      id: r.id,
      customerName: r.name,
      customerEmail: r.email,
      content: r.feedback,
      timestamp: r.created_at,
      sentiment: r.sentiment as "positive" | "negative" | "neutral" | undefined
    }));
    return <StatsDetail type={view.statsType} comments={commentsForStats} onBack={() => setView({ type: "dashboard" })} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* User bar */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Logged in as <span className="text-foreground font-medium">{user?.email}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4">Overview</h2>
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

        {/* Sentiment Summary */}
        <section className="mb-10">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Distribution</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilterSentiment(filterSentiment === "positive" ? null : "positive")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  filterSentiment === "positive" 
                    ? "border-success bg-success/10" 
                    : "border-border hover:border-success/50"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium text-foreground">Positive</span>
                <span className="text-lg font-bold text-success">
                  {reviews.filter(r => r.sentiment === "positive").length}
                </span>
              </button>
              <button
                onClick={() => setFilterSentiment(filterSentiment === "negative" ? null : "negative")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  filterSentiment === "negative" 
                    ? "border-destructive bg-destructive/10" 
                    : "border-border hover:border-destructive/50"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-sm font-medium text-foreground">Negative</span>
                <span className="text-lg font-bold text-destructive">
                  {reviews.filter(r => r.sentiment === "negative").length}
                </span>
              </button>
              <button
                onClick={() => setFilterSentiment(filterSentiment === "neutral" ? null : "neutral")}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                  filterSentiment === "neutral" 
                    ? "border-warning bg-warning/10" 
                    : "border-border hover:border-warning/50"
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium text-foreground">Neutral</span>
                <span className="text-lg font-bold text-warning">
                  {reviews.filter(r => r.sentiment === "neutral").length}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-foreground">Customer Reviews</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              {filterSentiment && (
                <Button variant="ghost" size="sm" onClick={() => setFilterSentiment(null)}>
                  <Filter className="w-4 h-4 mr-1" />
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reviews found matching your criteria.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
