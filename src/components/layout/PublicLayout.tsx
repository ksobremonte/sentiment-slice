import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, Star, Phone } from "lucide-react";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import CustomerChatWidget from "@/components/public/CustomerChatWidget";
import { PageTransition } from "@/components/ui/animated";
import { cn } from "@/lib/utils";

interface PublicLayoutProps {
  children: ReactNode;
}

const publicNavItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Menu", icon: UtensilsCrossed, path: "/menu" },
  { label: "Reviews", icon: Star, path: "/reviews" },
  { label: "Contact", icon: Phone, path: "/contact" },
];

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 md:pb-0">
      {/* Header removed — navigation via bottom nav on mobile, footer links on desktop */}
      <main className="flex-1">
        <PageTransition key={location.pathname}>
          {children}
        </PageTransition>
      </main>
      <PublicFooter />
      <CustomerChatWidget />

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2">
          {publicNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PublicLayout;
