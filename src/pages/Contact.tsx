import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

const Contact = () => {
  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Reach out to us anytime!
            </p>
          </div>

          {/* Contact Cards */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">Phone</h3>
                  <p className="text-lg text-primary font-medium">+63 (074) 445-0777</p>
                  <p className="text-sm text-muted-foreground mt-2">For orders & inquiries</p>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">Email</h3>
                  <p className="text-lg text-accent font-medium">hello@pizzavolante.ph</p>
                  <p className="text-sm text-muted-foreground mt-2">We reply within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-success" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">Address</h3>
                  <p className="text-foreground font-medium">123 Session Road</p>
                  <p className="text-muted-foreground">Baguio City, 2600</p>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-7 h-7 text-warning" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">Hours</h3>
                  <div className="space-y-1">
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Mon - Thu:</span> 11AM - 9PM
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Fri - Sat:</span> 11AM - 10PM
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Sunday:</span> 12PM - 8PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-secondary rounded-3xl p-8 text-center shadow-warm">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-display font-semibold text-xl text-secondary-foreground mb-2">Visit Our Pizzeria</h3>
              <p className="text-secondary-foreground/80">Located at the heart of Session Road, Baguio City</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
