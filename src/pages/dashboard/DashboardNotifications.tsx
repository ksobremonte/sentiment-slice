import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Bell, AlertTriangle, Star, MessageSquare, TrendingDown, ShieldAlert, CheckCheck } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { useNotificationReads } from "@/hooks/useNotificationReads";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  time: string;
  date: Date;
  type: "negative" | "alert" | "review";
}

const DashboardNotifications = () => {
  const [search, setSearch] = useState("");
  const { data: reviews } = useReviews();
  const { isRead, markAsRead, markAllAsRead, unreadCount } = useNotificationReads();
  const navigate = useNavigate();

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!reviews) return [];

    return reviews
      .filter((r) => r.sentiment === "negative" || r.sentiment === "mixed" || r.rating <= 2)
      .map((r) => {
        const isNeg = r.sentiment === "negative";
        const isMixed = r.sentiment === "mixed";
        const isLowRating = r.rating <= 2;

        let icon = AlertTriangle;
        let iconColor = "text-destructive";
        let iconBg = "bg-destructive/10";
        let title = "Negative Review Detected";

        if (isNeg) {
          icon = ShieldAlert;
          title = "Negative Sentiment Alert";
        } else if (isMixed) {
          icon = TrendingDown;
          iconColor = "text-warning-foreground";
          iconBg = "bg-warning/15";
          title = "Mixed Sentiment Review";
        } else if (isLowRating) {
          icon = Star;
          iconColor = "text-accent";
          iconBg = "bg-accent/10";
          title = `Low Rating (${r.rating}★)`;
        }

        return {
          id: r.id,
          icon,
          iconColor,
          iconBg,
          title,
          message: `${r.name}: "${r.feedback.length > 80 ? r.feedback.slice(0, 80) + "…" : r.feedback}"`,
          time: format(new Date(r.created_at), "h:mm a"),
          date: new Date(r.created_at),
          type: isNeg ? "negative" as const : "review" as const,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [reviews]);

  const filtered = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  const todayItems = filtered.filter((n) => isToday(n.date));
  const yesterdayItems = filtered.filter((n) => isYesterday(n.date));
  const olderItems = filtered.filter((n) => !isToday(n.date) && !isYesterday(n.date));

  const activityItems = reviews
    ?.slice(0, 20)
    .map((r) => ({
      id: r.id,
      icon: r.admin_response ? MessageSquare : Star,
      iconColor: r.admin_response ? "text-primary" : "text-accent",
      iconBg: r.admin_response ? "bg-primary/10" : "bg-accent/10",
      title: r.admin_response ? "Admin Responded" : "New Review",
      message: `${r.name} — ${r.rating}★`,
      time: format(new Date(r.created_at), "h:mm a"),
      date: new Date(r.created_at),
      type: "review" as const,
    })) ?? [];

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead.mutate(item.id);
    navigate(`/pv-dashboard/reviews/${item.id}`);
  };

  const renderGroup = (label: string, items: NotificationItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
          {label}
        </h3>
        <div className="space-y-2">
          {items.map((item) => {
            const read = isRead(item.id);
            return (
              <Card
                key={item.id}
                className={cn(
                  "border border-border/60 shadow-none hover:shadow-sm transition-all cursor-pointer hover:border-primary/30",
                  !read && "bg-primary/[0.03] border-primary/20"
                )}
                onClick={() => handleNotificationClick(item)}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Unread dot */}
                  <div className="flex items-center pt-1.5">
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0 transition-colors",
                      read ? "bg-transparent" : "bg-destructive"
                    )} />
                  </div>
                  <div className={cn("rounded-full p-2.5 shrink-0", item.iconBg)}>
                    <item.icon className={cn("h-4 w-4", item.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm text-foreground",
                      read ? "font-medium" : "font-bold"
                    )}>{item.title}</p>
                    <p className={cn(
                      "text-xs mt-0.5 line-clamp-2",
                      read ? "text-muted-foreground" : "text-foreground/80"
                    )}>{item.message}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                    {item.time}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Stay updated on negative reviews and sentiment alerts
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
            {filtered.length > 0 && (
              <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
                {unreadCount > 0 ? `${unreadCount} unread` : `${filtered.length} alert${filtered.length !== 1 ? "s" : ""}`}
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notifications">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Star className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="space-y-6 mt-4">
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No notifications found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Negative reviews and alerts will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {renderGroup("Today", todayItems)}
                {renderGroup("Yesterday", yesterdayItems)}
                {renderGroup("Earlier", olderItems)}
              </>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-4">
            {activityItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {activityItems.map((item) => (
                  <Card
                    key={item.id}
                    className="border border-border/60 shadow-none hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/30"
                    onClick={() => navigate("/pv-dashboard/reviews")}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={cn("rounded-full p-2.5 shrink-0", item.iconBg)}>
                        <item.icon className={cn("h-4 w-4", item.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                        {item.time}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications;
