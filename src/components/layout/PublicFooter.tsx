import { Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { FadeIn } from "@/components/ui/animated";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const PublicFooter = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-6 py-16">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-3">
                <img src={pizzaVolanteLogo} alt="Pizza Volante Logo" className="h-14 w-auto" />
                <div>
                  <h3 className="font-brand text-2xl text-secondary-foreground">Pizza Volante</h3>
                  <p className="text-[10px] text-secondary-foreground/50 font-semibold tracking-[0.2em] uppercase">Baguio City</p>
                </div>
              </div>
              <p className="text-sm text-secondary-foreground/70 leading-relaxed">
                Serving the best artisan pizzas in the City of Pines since 2020. Made with love and tradition.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-secondary-foreground/50 mb-5">
                Explore
              </h4>
              <nav className="flex flex-col gap-3">
                {[
                  { name: "Home", path: "/" },
                  { name: "About Us", path: "/about" },
                  { name: "Our Menu", path: "/menu" },
                  { name: "Reviews", path: "/read-reviews" },
                ].map((link) => (
                  <Link key={link.path} to={link.path} className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-secondary-foreground/50 mb-5">
                Contact
              </h4>
              <div className="space-y-3">
                {[
                  { icon: Phone, text: "+63 (074) 445-0777" },
                  { icon: Mail, text: "hello@pizzavolante.ph" },
                  { icon: MapPin, text: "Session Road, Baguio City" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-secondary-foreground/70">
                    <Icon className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-secondary-foreground/50 mb-5">
                Hours
              </h4>
              <div className="space-y-2 text-sm text-secondary-foreground/70">
                {[
                  { day: "Mon – Thu", time: "11AM – 9PM" },
                  { day: "Fri – Sat", time: "11AM – 10PM" },
                  { day: "Sunday", time: "12PM – 8PM" },
                ].map(({ day, time }) => (
                  <div key={day} className="flex justify-between">
                    <span>{day}</span>
                    <span className="text-primary font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-xs text-secondary-foreground/40">
            © {new Date().getFullYear()} Pizza Volante. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
