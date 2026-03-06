import { ReactNode, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, MessageSquare, PieChart, Star, TrendingUp,
  LogOut, Shield, Brain, Bell, Settings, User, HelpCircle,
  ChevronsUpDown, ArrowLeftRight, BellDot,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useReviews } from "@/hooks/useReviews";
import { useNotificationReads } from "@/hooks/useNotificationReads";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const mainNavKeys = [
  { key: "nav.overview", icon: LayoutDashboard, path: "/pv-dashboard" },
  { key: "nav.chats", icon: MessageSquare, path: "/pv-dashboard/conversations" },
  { key: "nav.sentiment", icon: PieChart, path: "/pv-dashboard/sentiment" },
  { key: "nav.reviews", icon: Star, path: "/pv-dashboard/reviews" },
  { key: "nav.trends", icon: TrendingUp, path: "/pv-dashboard/trends" },
];

const adminNavKeys = [
  { key: "nav.detection", icon: Shield, path: "/pv-dashboard/detection" },
  { key: "nav.aiConfig", icon: Brain, path: "/pv-dashboard/ai" },
  { key: "nav.alerts", icon: Bell, path: "/pv-dashboard/alerts" },
];

const DashboardSidebar = () => {
  const { signOut, user } = useAuthContext();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const displayName = profile?.display_name || "You";
  const avatarUrl = profile?.avatar_url;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/pv-admin");
    }
  };

  const NavItem = ({ item }: { item: typeof mainNavKeys[0] }) => {
    const isActive = location.pathname === item.path;
    const label = t(item.key);
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={label}
          onClick={() => navigate(item.path)}
          className={cn(isActive && "bg-primary/10 text-primary font-semibold")}
        >
          <item.icon className="h-4 w-4" />
          {!collapsed && <span>{label}</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={pizzaVolanteLogo} alt="Pizza Volante Logo" className={cn("w-auto transition-all", collapsed ? "h-8" : "h-12")} />
          {!collapsed && (
            <div>
              <h1 className="font-brand text-lg text-foreground leading-tight">Pizza Volante</h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">Baguio City</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavKeys.map((item) => <NavItem key={item.path} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="h-3 w-3 mr-1" />
            {t("nav.admin")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavKeys.map((item) => <NavItem key={item.path} item={item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start gap-2 rounded-xl border-2 border-border bg-card/50 hover:bg-accent/80 h-auto py-2",
                collapsed && "justify-center px-0"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {displayName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="text-xs text-foreground truncate flex-1 text-left font-medium">{displayName}</span>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span>{displayName}</span>
                <span className="text-[10px] truncate font-sans text-left font-normal text-popover-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/pv-dashboard/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              {t("user.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/pv-dashboard/help")}>
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("user.helpCenter")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/pv-dashboard/switch-account")}>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              {t("user.switchAccount")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              {t("user.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: reviews } = useReviews();

  const negativeCount = useMemo(() => {
    if (!reviews) return 0;
    return reviews.filter(
      (r) => r.sentiment === "negative" || r.sentiment === "mixed" || r.rating <= 2
    ).length;
  }, [reviews]);

  const isOnNotifications = location.pathname === "/pv-dashboard/notifications";
  const isOnConversations = location.pathname === "/pv-dashboard/conversations";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-cream-warm">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-cream-warm/95 backdrop-blur-sm px-4 py-3">
            <SidebarTrigger />
            <div className="text-sm font-semibold text-foreground flex-1">{t("nav.sentimentDashboard")}</div>
            <div className="flex items-center gap-2">
              <Button
                variant={isOnConversations ? "default" : "outline"}
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate("/pv-dashboard/conversations")}
                title="Conversations"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant={isOnNotifications ? "default" : "outline"}
                size="icon"
                className="h-9 w-9 rounded-full relative !overflow-visible"
                onClick={() => navigate("/pv-dashboard/notifications")}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {negativeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {negativeCount > 99 ? "99+" : negativeCount}
                  </span>
                )}
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 brick-overlay">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
