import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, UtensilsCrossed, Star, Phone, ChevronUp } from "lucide-react";
import PublicFooter from "./PublicFooter";
import PublicHeader from "./PublicHeader";
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

const SCROLL_THRESHOLD = 300;

const PublicLayout = ({ children }: PublicLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        setShowScrollTop(window.scrollY > SCROLL_THRESHOLD);
        ticking.current = false;
      });
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="hidden md:block">
        <PublicHeader />
      </div>
      <main className="flex-1 pb-20 md:pb-0">
        <PageTransition key={location.pathname}>
          {children}
        </PageTransition>
      </main>
      <PublicFooter />
      <CustomerChatWidget />

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={cn(
          "fixed z-[9998] rounded-full p-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-in-out",
          "bg-foreground/85 text-background hover:bg-foreground hover:scale-110 active:scale-95",
          // Mobile: bottom-left above nav bar
          "left-4 bottom-[6.5rem]",
          // Desktop: bottom-right with comfortable spacing
          "md:left-auto md:right-6 md:bottom-8",
          showScrollTop
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        )}
        aria-label="Scroll to top"
      >
        <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
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
