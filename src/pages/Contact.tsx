import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import Seo from "@/components/Seo";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, ParallaxImage, ZoomImage, AnimatedButton,
} from "@/components/ui/animated";
import { Button } from "@/components/ui/button";
import restaurantExterior from "@/assets/restaurant-exterior.jpg";
import restaurantInteriorReal from "@/assets/restaurant-interior-real.webp";

const Contact = () => {
  return (
    <PublicLayout>
      <Seo
        title="Contact Pizza Volante — Baguio City Pizzeria"
        description="Visit Pizza Volante at 082 Diego Silang St, Baguio City. Call +63 (074) 445-0777 for reservations, delivery, and inquiries."
        path="/contact"
      />
      {/* Hero — Real exterior */}
      <section className="relative h-[35vh] md:h-[45vh] flex items-center justify-center overflow-hidden">
        <img src={restaurantExterior} alt="Pizza Volante outdoor seating" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 text-center px-6">
          <FadeIn>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.25em] mb-2">We'd Love to Hear From You</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
              Contact Us
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6">
          {/* Contact Cards */}
          <StaggerContainer className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Phone, title: "Phone", primary: "+63 (074) 445-0777", secondary: "For orders & inquiries", color: "text-primary", bg: "bg-primary/8" },
              { icon: Mail, title: "Email", primary: "hello@pizzavolante.ph", secondary: "We reply within 24 hours", color: "text-accent", bg: "bg-accent/8" },
              { icon: MapPin, title: "Address", primary: "082, Diego Silang St, Baguio, Benguet", secondary: "Baguio City, 2600", color: "text-success", bg: "bg-success/8" },
              { icon: Clock, title: "Hours", primary: "Mon–Sat: 11AM–10PM", secondary: "Sunday: 12PM–8PM", color: "text-warning", bg: "bg-warning/8" },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <HoverCard className="h-full">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-card h-full group">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm font-medium text-foreground">{item.primary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.secondary}</p>
                      </div>
                    </div>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Google Maps Embed */}
          <FadeIn delay={0.2}>
            <div className="max-w-4xl mx-auto mt-10 overflow-hidden rounded-2xl shadow-warm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d957.0!2d120.5960!3d16.4123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMDgyIERpZWdvIFNpbGFuZyBTdCwgQmFndWlvLCBCZW5ndWV0!5e0!3m2!1sen!2sph!4v1700000000000"
                width="100%"
                height="320"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Pizza Volante Location - 082 Diego Silang St, Baguio, Benguet"
                className="w-full h-56 md:h-80"
              />
            </div>
          </FadeIn>

          {/* Visit CTA */}
          <FadeIn delay={0.3}>
            <div className="max-w-4xl mx-auto mt-10">
              <div className="bg-secondary rounded-2xl p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-secondary-foreground/[0.02] -translate-y-1/2 translate-x-1/2" />
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg text-secondary-foreground mb-1">Visit Our Pizzeria</h3>
                <p className="text-sm text-secondary-foreground/50 mb-6">Located at the heart of Session Road, Baguio City</p>
                <AnimatedButton>
                  <Button asChild size="lg" className="rounded-xl shadow-glow btn-glow">
                    <Link to="/menu">
                      See Our Menu <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </AnimatedButton>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
