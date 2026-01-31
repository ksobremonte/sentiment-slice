import { Pizza, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Menu", path: "/menu" },
  { name: "Reviews", path: "/reviews" },
  { name: "Contact", path: "/contact" },
];

const PublicHeader = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b-2 border-primary/20 bg-cream-warm/95 backdrop-blur-sm sticky top-0 z-50 shadow-subtle">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-warm transition-transform group-hover:scale-105">
              <Pizza className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Pizza <span className="text-primary">Volante</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wide">Baguio City</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-cream-warm">
              <div className="flex items-center gap-3 mb-8 mt-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Pizza className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground">Pizza Volante</h2>
                  <p className="text-xs text-muted-foreground">Baguio City</p>
                </div>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-base font-medium transition-all",
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-primary/10"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
