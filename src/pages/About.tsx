import { Pizza, Heart, Users, Award, Utensils, MapPin, Phone, Clock, Target, Eye } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

const About = () => {
  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Our <span className="text-primary">Story</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Since December 1, 1999, Pizza Volante has been serving Baguio City with 
              freshly made pizzas and Italian-inspired comfort food.
            </p>
          </div>

          {/* Story Cards */}
          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            <div className="bg-card border-2 border-border rounded-3xl p-8 md:p-10 shadow-card hover:shadow-warm transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground pt-2">How It All Began</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Pizza Volante is a homegrown Baguio-based restaurant brand established on 
                December 1, 1999. It began as a small take-out counter at the old Session Theater 
                on Session Road and has since grown into one of Baguio's most recognized dining 
                institutions. The name "Volante," meaning flying in French/Latin, reflects the 
                brand's vision of offering quick, delightful, and accessible meals to locals and 
                tourists alike.
              </p>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-8 md:p-10 shadow-card hover:shadow-warm transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Pizza className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground pt-2">What We Offer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Known for its affordable pricing, generous portions, and late-night service 
                (some branches open 24/7), Pizza Volante has become a staple dining destination 
                for those seeking warmth and comfort in Baguio's cool mountain climate. Our menu 
                features a variety of pizza flavors, pasta dishes, rice meals, breakfast offerings, 
                and signature desserts that highlight both local and international tastes.
              </p>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-card hover:shadow-warm transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To be the leading local restaurant brand in Baguio City and Northern Luzon, 
                known for excellence in food quality, customer satisfaction, and community values.
              </p>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-card hover:shadow-warm transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To serve the highest quality food at reasonable prices, in a warm and welcoming 
                environment, with service that is genuine and free of pretension.
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-secondary/30 border-2 border-border rounded-3xl p-8 max-w-4xl mx-auto mb-16">
            <h3 className="text-xl font-display font-semibold text-foreground mb-6 text-center">Visit Us</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Headquarters</p>
                  <p className="text-sm text-muted-foreground">082 Theatre Building, Diego Silang Street (Session Road), Baguio City, Benguet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Contact</p>
                  <p className="text-sm text-muted-foreground">+63 (074) 445-0777</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Hours</p>
                  <p className="text-sm text-muted-foreground">Some branches open 24/7</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Branches:</strong> Session Road • Ayala TechnoHub (Camp John Hay) • Wright Park – Baguio City
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <Pizza className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Quality First</h3>
              <p className="text-sm text-muted-foreground">Premium ingredients in every bite</p>
            </div>
            
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <Heart className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Made with Love</h3>
              <p className="text-sm text-muted-foreground">25+ years of serving Baguio</p>
            </div>
            
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                <Users className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">Part of Baguio's culinary heritage</p>
            </div>
            
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-5">
                <Award className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Excellence</h3>
              <p className="text-sm text-muted-foreground">Striving for perfection daily</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
