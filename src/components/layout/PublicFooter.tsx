import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const PublicFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t-4 border-primary/30">
      <div className="container mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img 
                src={pizzaVolanteLogo} 
                alt="Pizza Volante Logo" 
                className="h-16 w-auto"
              />
              <div>
                <h3 className="font-brand text-2xl text-secondary-foreground">Pizza Volante</h3>
                <p className="text-xs text-secondary-foreground/70">Baguio City</p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/80 leading-relaxed">
              Serving the best artisan pizzas in the City of Pines since 2020. Made with love and tradition.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg text-secondary-foreground mb-5 border-b border-secondary-foreground/20 pb-2">
              Quick Links
            </h4>
            <nav className="flex flex-col gap-3">
              <Link to="/" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Home</Link>
              <Link to="/about" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">About Us</Link>
              <Link to="/menu" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Our Menu</Link>
              <Link to="/reviews" className="text-sm text-secondary-foreground/80 hover:text-primary transition-colors">Reviews</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg text-secondary-foreground mb-5 border-b border-secondary-foreground/20 pb-2">
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-secondary-foreground/80">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <span>+63 912 345 6789</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-foreground/80">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span>hello@pizzavolante.ph</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-secondary-foreground/80">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span>Session Road, Baguio City</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display font-semibold text-lg text-secondary-foreground mb-5 border-b border-secondary-foreground/20 pb-2">
              Opening Hours
            </h4>
            <div className="space-y-3 text-sm text-secondary-foreground/80">
              <div className="flex justify-between">
                <span>Mon - Thu</span>
                <span className="text-primary font-medium">11AM - 9PM</span>
              </div>
              <div className="flex justify-between">
                <span>Fri - Sat</span>
                <span className="text-primary font-medium">11AM - 10PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-primary font-medium">12PM - 8PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-10 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/60">
            © {new Date().getFullYear()} Pizza Volante. All rights reserved. Made with ❤️ in Baguio City
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
