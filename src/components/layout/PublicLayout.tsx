import { ReactNode, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, Star, Phone, ChevronUp } from "lucide-react";
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20 md:pb-0">
        <PageTransition key={location.pathname}>
          {children}
        </PageTransition>
      </main>
      <PublicFooter />
      <CustomerChatWidget />

      {/* Scroll to Top Button - mobile/tablet only */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed z-[9998] left-4 bg-foreground/90 text-background rounded-xl p-3 shadow-lg backdrop-blur-sm transition-all duration-300 md:hidden",
          "bottom-[6.5rem]",
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
