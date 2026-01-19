import { Pizza, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const PublicFooter = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Pizza className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Pizza Volante</h3>
                <p className="text-xs text-muted-foreground">Baguio City</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Serving the best artisan pizzas in the City of Pines since 2020.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/menu" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Menu</Link>
              <Link to="/reviews" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>+63 912 345 6789</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>hello@pizzavolante.ph</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>Session Road, Baguio City</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Hours</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Mon - Thu: 11AM - 9PM</p>
              <p>Fri - Sat: 11AM - 10PM</p>
              <p>Sunday: 12PM - 8PM</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pizza Volante. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
