import { ArrowLeft, MessageSquare, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Comment } from "./CommentCard";

interface StatsDetailProps {
  type: "comments" | "customers" | "response";
  comments: Comment[];
  onBack: () => void;
}

const StatsDetail = ({ type, comments, onBack }: StatsDetailProps) => {
  const getStatsData = () => {
    switch (type) {
      case "comments":
        return {
          icon: MessageSquare,
          title: "Total Comments Analysis",
          subtitle: "Breakdown of all customer feedback",
        };
      case "customers":
        return {
          icon: Users,
          title: "Unique Customers",
          subtitle: "Customer engagement overview",
        };
      case "response":
        return {
          icon: Clock,
          title: "Response Time Analysis",
          subtitle: "Average response metrics",
        };
    }
  };

  const statsData = getStatsData();
  const Icon = statsData.icon;

  const positiveCount = comments.filter(c => c.sentiment === "positive").length;
  const negativeCount = comments.filter(c => c.sentiment === "negative").length;
  const neutralCount = comments.filter(c => c.sentiment === "neutral").length;
  const uniqueCustomers = new Set(comments.map(c => c.customerEmail)).size;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{statsData.title}</h1>
              <p className="text-muted-foreground">{statsData.subtitle}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Positive</span>
              </div>
              <p className="text-3xl font-bold text-success">{positiveCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((positiveCount / comments.length) * 100).toFixed(1)}% of total
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Negative</span>
              </div>
              <p className="text-3xl font-bold text-destructive">{negativeCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((negativeCount / comments.length) * 100).toFixed(1)}% of total
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-warning" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Neutral</span>
              </div>
              <p className="text-3xl font-bold text-warning">{neutralCount}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {((neutralCount / comments.length) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-2xl font-bold text-foreground">{comments.length}</p>
                <p className="text-sm text-muted-foreground">Total Comments</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{uniqueCustomers}</p>
                <p className="text-sm text-muted-foreground">Unique Customers</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">2.5m</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">87%</p>
                <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <Button variant="default" onClick={onBack}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDetail;
