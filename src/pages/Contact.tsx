import { Phone, Mail, MapPin, Clock } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/animated";

const Contact = () => {
  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          {/* Header */}
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Contact Us</p>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                Get in Touch
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Have questions? We'd love to hear from you.
              </p>
            </div>
          </FadeIn>

          {/* Contact Cards */}
          <StaggerContainer className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Phone,
                title: "Phone",
                primary: "+63 (074) 445-0777",
                secondary: "For orders & inquiries",
                color: "text-primary",
                bg: "bg-primary/8",
              },
              {
                icon: Mail,
                title: "Email",
                primary: "hello@pizzavolante.ph",
                secondary: "We reply within 24 hours",
                color: "text-accent",
                bg: "bg-accent/8",
              },
              {
                icon: MapPin,
                title: "Address",
                primary: "123 Session Road",
                secondary: "Baguio City, 2600",
                color: "text-success",
                bg: "bg-success/8",
              },
              {
                icon: Clock,
                title: "Hours",
                primary: "Mon–Sat: 11AM–10PM",
                secondary: "Sunday: 12PM–8PM",
                color: "text-warning",
                bg: "bg-warning/8",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <HoverCard className="h-full">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-card h-full">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0`}>
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

          {/* Map placeholder */}
          <FadeIn delay={0.3}>
            <div className="max-w-4xl mx-auto mt-10">
              <div className="bg-secondary rounded-2xl p-10 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg text-secondary-foreground mb-1">Visit Our Pizzeria</h3>
                <p className="text-sm text-secondary-foreground/60">Located at the heart of Session Road, Baguio City</p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
