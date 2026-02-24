import { Brain, Sparkles, MessageSquare, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReviews } from "@/hooks/useReviews";
import { useMemo } from "react";

const DashboardAI = () => {
  const { data: reviews = [] } = useReviews();

  const aiStats = useMemo(() => {
    const analyzed = reviews.filter((r) => r.sentiment).length;
    const total = reviews.length;
    const rate = total > 0 ? Math.round((analyzed / total) * 100) : 0;
    return { analyzed, total, rate };
  }, [reviews]);

  const features = [
    {
      icon: Sparkles,
      title: "Sentiment Analysis",
      desc: "Automatically analyzes customer feedback to classify as positive, negative, or neutral.",
      status: "Active",
    },
    {
      icon: MessageSquare,
      title: "AI Customer Chat",
      desc: "Chatbot answers customer questions using real review data and store information.",
      status: "Active",
    },
    {
      icon: BarChart3,
      title: "AI Review Sorting",
      desc: "Sorts reviews by relevance using AI to surface the most important feedback first.",
      status: "Active",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">AI Configuration</h2>
            <p className="text-sm text-muted-foreground">Manage AI-powered features</p>
          </div>
        </div>

        {/* Analysis Stats */}
        <Card className="p-6 rounded-2xl border-2">
          <h3 className="font-display font-semibold text-foreground mb-4">Analysis Coverage</h3>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-display font-bold text-primary">{aiStats.rate}%</span>
            <span className="text-sm text-muted-foreground mb-1">
              {aiStats.analyzed} of {aiStats.total} reviews analyzed
            </span>
          </div>
          <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${aiStats.rate}%` }}
            />
          </div>
        </Card>

        {/* Feature List */}
        <div className="space-y-3">
          {features.map((feature, i) => (
            <Card key={i} className="p-5 rounded-2xl border-2">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-semibold text-foreground">{feature.title}</h4>
                    <Badge variant="secondary" className="bg-success/10 text-success border-0">
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 rounded-2xl border-2 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Model:</strong> Google Gemini (via Lovable AI Gateway)
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            AI features are powered by Lovable AI. Usage is metered — check your workspace settings for current usage.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAI;
