import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, PieChart, Star, LogOut, Shield, Brain, Users, History, ChevronUp, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import DashboardHeader from "./DashboardHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const mainNavItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/pv-dashboard" },
  { label: "Chats", icon: MessageSquare, path: "/pv-dashboard/conversations" },
  { label: "Sentiment", icon: PieChart, path: "/pv-dashboard/sentiment" },
  { label: "Reviews", icon: Star, path: "/pv-dashboard/reviews" },
];

const adminNavItems = [
  { label: "Audit Log", icon: History, path: "/pv-dashboard/audit" },
  { label: "Detection", icon: Shield, path: "/pv-dashboard/detection" },
  { label: "AI Config", icon: Brain, path: "/pv-dashboard/ai" },
  { label: "Users", icon: Users, path: "/pv-dashboard/users" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAdmin, setShowAdmin] = useState(false);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/pv-admin");
    }
  };

  const isAdminPage = adminNavItems.some((item) => location.pathname === item.path);
  const activeNav = isAdminPage ? adminNavItems : mainNavItems;

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay pb-24">
      <DashboardHeader />

      {/* User bar */}
      <div className="border-b-2 border-border bg-card/80">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">
            <span className="text-foreground font-semibold">{user?.email}</span>
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl border-2 font-semibold">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Admin panel toggle (slides up) */}
      {showAdmin && (
        <div className="fixed bottom-[72px] left-0 right-0 z-50 bg-card border-t-2 border-border shadow-warm animate-fade-in">
          <div className="flex items-center justify-around py-2">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setShowAdmin(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px]",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border shadow-warm">
        <div className="flex items-center justify-around py-2">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setShowAdmin(false); }}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[56px]",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
          {/* Admin toggle */}
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all min-w-[56px]",
              (showAdmin || isAdminPage) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className={cn("w-5 h-5", (showAdmin || isAdminPage) && "text-primary")} />
            <span className="text-[10px] font-semibold">Admin</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
