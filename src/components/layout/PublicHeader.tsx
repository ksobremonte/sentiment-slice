import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

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
          <Link to="/" className="flex items-center gap-4 group">
            <img 
              src={pizzaVolanteLogo} 
              alt="Pizza Volante Logo" 
              className="h-16 md:h-20 w-auto transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <h1 className="font-brand text-3xl md:text-4xl text-foreground leading-tight">
                Pizza Volante
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
              <div className="flex items-center gap-4 mb-8 mt-4">
                <img 
                  src={pizzaVolanteLogo} 
                  alt="Pizza Volante Logo" 
                  className="h-14 w-auto"
                />
                <div>
                  <h2 className="font-brand text-2xl text-foreground">Pizza Volante</h2>
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
