import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertTriangle, Star, ShieldAlert, TrendingDown, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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
}

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { data: reviews } = useReviews();
  const { isRead, markAsRead, markAllAsRead, unreadCount } = useNotificationReads();

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!reviews) return [];
    return reviews
      .filter((r) => r.sentiment === "negative" || r.sentiment === "mixed" || r.rating <= 2)
      .map((r) => {
        const isNeg = r.sentiment === "negative";
        const isMixed = r.sentiment === "mixed";

        let icon = AlertTriangle;
        let iconColor = "text-destructive";
        let iconBg = "bg-destructive/10";
        let title = "Negative Review Detected";

        if (isNeg) {
          icon = ShieldAlert;
          title = "Negative Sentiment Alert";
        } else if (isMixed) {
          icon = TrendingDown;
          iconColor = "text-yellow-600";
          iconBg = "bg-yellow-500/10";
          title = "Mixed Sentiment Review";
        } else {
          icon = Star;
          iconColor = "text-orange-500";
          iconBg = "bg-orange-500/10";
          title = `Low Rating (${r.rating}★)`;
        }

        return {
          id: r.id,
          icon,
          iconColor,
          iconBg,
          title,
          message: `${r.name}: "${r.feedback.length > 60 ? r.feedback.slice(0, 60) + "…" : r.feedback}"`,
          time: format(new Date(r.created_at), "h:mm a"),
          date: new Date(r.created_at),
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 20);
  }, [reviews]);

  const todayItems = notifications.filter((n) => isToday(n.date));
  const yesterdayItems = notifications.filter((n) => isYesterday(n.date));
  const olderItems = notifications.filter((n) => !isToday(n.date) && !isYesterday(n.date));

  const handleClick = (item: NotificationItem) => {
    markAsRead.mutate(item.id);
    navigate(`/pv-dashboard/reviews/${item.id}`);
  };

  const renderGroup = (label: string, items: NotificationItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">
          {label}
        </p>
        {items.map((item) => {
          const read = isRead(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2.5 text-left rounded-lg transition-colors hover:bg-accent/60",
                !read && "bg-primary/[0.04]"
              )}
            >
              {/* Unread indicator */}
              <div className="flex items-center pt-2">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    read ? "bg-transparent" : "bg-destructive"
                  )}
                />
              </div>
              <div className={cn("rounded-full p-2 shrink-0", item.iconBg)}>
                <item.icon className={cn("h-3.5 w-3.5", item.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-xs text-foreground leading-tight",
                    read ? "font-medium" : "font-bold"
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    "text-[11px] mt-0.5 line-clamp-2 leading-snug",
                    read ? "text-muted-foreground" : "text-foreground/70"
                  )}
                >
                  {item.message}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
                {item.time}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full relative !overflow-visible"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 rounded-2xl border-2 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <div className="overflow-y-auto max-h-[380px] overscroll-contain">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                Alerts for negative reviews will appear here
              </p>
            </div>
          ) : (
            <div className="py-1">
              {renderGroup("Today", todayItems)}
              {renderGroup("Yesterday", yesterdayItems)}
              {renderGroup("Earlier", olderItems)}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary hover:text-primary font-semibold"
                onClick={() => navigate("/pv-dashboard/notifications")}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
