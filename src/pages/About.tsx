import { Pizza, Heart, Users, Award, Utensils, Leaf } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, ParallaxImage, RevealText,
} from "@/components/ui/animated";
import restaurantInterior from "@/assets/restaurant-interior.jpg";

const About = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative h-[40vh] md:h-[45vh] flex items-center justify-center overflow-hidden">
        <ParallaxImage
          src={restaurantInterior}
          alt="Our cozy restaurant"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center px-6">
          <FadeIn>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.25em] mb-2">Our Story</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
              About Us
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6">
          {/* Story */}
          <div className="max-w-3xl mx-auto mb-24">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  From Family Kitchen to
                  <span className="text-gradient block">Baguio's Favorite</span>
                </h2>
                <div className="section-divider mt-6" />
              </div>
            </FadeIn>

            <div className="space-y-6">
              {[
                {
                  icon: Utensils,
                  iconColor: "text-primary",
                  iconBg: "bg-primary/8",
                  title: "How It All Began",
                  text: "Pizza Volante started in 2020 when the Reyes family decided to share their grandmother's secret pizza recipes with Baguio. What began as a small home kitchen operation quickly grew as word spread about our authentic Italian-Filipino fusion pizzas.",
                },
                {
                  icon: Leaf,
                  iconColor: "text-accent",
                  iconBg: "bg-accent/8",
                  title: "Our Philosophy",
                  text: "We believe great pizza starts with great ingredients. Every pizza is made with hand-stretched dough, san marzano tomatoes, fresh mozzarella, and locally-sourced vegetables from Benguet farms.",
                },
              ].map((card, i) => (
                <FadeIn key={card.title} delay={i * 0.12}>
                  <HoverCard>
                    <div className="bg-card border border-border rounded-2xl p-8 shadow-card group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                        </div>
                        <h3 className="text-xl font-display font-semibold text-foreground pt-1">{card.title}</h3>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-14">{card.text}</p>
                    </div>
                  </HoverCard>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Values */}
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.25em] mb-3">What Drives Us</p>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">Our Values</h2>
              <div className="section-divider mt-6" />
            </div>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Pizza, title: "Quality First", desc: "Premium ingredients in every bite", color: "text-primary", bg: "bg-primary/8" },
              { icon: Heart, title: "Made with Love", desc: "Family recipes, homemade taste", color: "text-accent", bg: "bg-accent/8" },
              { icon: Users, title: "Community", desc: "Supporting local suppliers", color: "text-success", bg: "bg-success/8" },
              { icon: Award, title: "Excellence", desc: "Striving for perfection daily", color: "text-warning", bg: "bg-warning/8" },
            ].map((val) => (
              <StaggerItem key={val.title}>
                <HoverCard className="h-full">
                  <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-card h-full group">
                    <div className={`w-12 h-12 rounded-xl ${val.bg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <val.icon className={`w-6 h-6 ${val.color}`} />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{val.title}</h3>
                    <p className="text-xs text-muted-foreground">{val.desc}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
