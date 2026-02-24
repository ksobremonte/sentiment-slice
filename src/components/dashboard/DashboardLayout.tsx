import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, MessageSquare, PieChart, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import DashboardHeader from "./DashboardHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/pv-dashboard" },
  { label: "Conversations", icon: MessageSquare, path: "/pv-dashboard/conversations" },
  { label: "Sentiment", icon: PieChart, path: "/pv-dashboard/sentiment" },
  { label: "Reviews", icon: Star, path: "/pv-dashboard/reviews" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/pv-admin");
    }
  };

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay pb-20">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t-2 border-border shadow-warm">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "text-primary")} />
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      
    </div>
  );
};

export default DashboardLayout;
