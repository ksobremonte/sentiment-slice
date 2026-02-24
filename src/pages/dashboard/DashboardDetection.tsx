import { Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReviews } from "@/hooks/useReviews";
import { useMemo } from "react";

const DashboardDetection = () => {
  const { data: reviews = [] } = useReviews();

  const stats = useMemo(() => {
    const negative = reviews.filter((r) => r.sentiment === "negative");
    const unanalyzed = reviews.filter((r) => !r.sentiment);
    const lowRating = reviews.filter((r) => r.rating <= 2);
    const recentNegative = negative.filter((r) => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      return new Date(r.created_at).getTime() > dayAgo;
    });
    return { negative, unanalyzed, lowRating, recentNegative };
  }, [reviews]);

  const alerts = [
    {
      icon: AlertTriangle,
      title: "Negative Reviews (24h)",
      count: stats.recentNegative.length,
      color: stats.recentNegative.length > 0 ? "text-destructive" : "text-success",
      bg: stats.recentNegative.length > 0 ? "bg-destructive/10" : "bg-success/10",
      desc: stats.recentNegative.length > 0 ? "Requires attention" : "No recent negative feedback",
    },
    {
      icon: AlertTriangle,
      title: "Low Ratings (1-2 stars)",
      count: stats.lowRating.length,
      color: stats.lowRating.length > 0 ? "text-warning" : "text-success",
      bg: stats.lowRating.length > 0 ? "bg-warning/10" : "bg-success/10",
      desc: `${stats.lowRating.length} total low-rated reviews`,
    },
    {
      icon: Clock,
      title: "Unanalyzed Reviews",
      count: stats.unanalyzed.length,
      color: stats.unanalyzed.length > 0 ? "text-muted-foreground" : "text-success",
      bg: stats.unanalyzed.length > 0 ? "bg-muted/30" : "bg-success/10",
      desc: stats.unanalyzed.length > 0 ? "Pending sentiment analysis" : "All reviews analyzed",
    },
    {
      icon: CheckCircle,
      title: "Total Negative",
      count: stats.negative.length,
      color: "text-destructive",
      bg: "bg-destructive/10",
      desc: `Out of ${reviews.length} total reviews`,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Detection</h2>
            <p className="text-sm text-muted-foreground">Monitor flagged content and alerts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alerts.map((alert, i) => (
            <Card key={i} className="p-5 rounded-2xl border-2">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${alert.bg} flex items-center justify-center flex-shrink-0`}>
                  <alert.icon className={`h-6 w-6 ${alert.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{alert.title}</p>
                  <p className={`text-3xl font-display font-bold ${alert.color}`}>{alert.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {stats.recentNegative.length > 0 && (
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Recent Negative Reviews</h3>
            <div className="space-y-3">
              {stats.recentNegative.map((r) => (
                <Card key={r.id} className="p-4 rounded-2xl border-2 border-destructive/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{r.name}</span>
                    <Badge variant="destructive">⭐ {r.rating}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.feedback}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardDetection;
