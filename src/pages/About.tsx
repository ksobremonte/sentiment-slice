import { Pizza, Heart, Users, Award, Utensils, Leaf } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/animated";

const About = () => {
  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          {/* Header */}
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Our Story</p>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                From Family Kitchen to <span className="text-gradient">Baguio's Favorite</span>
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Discover the passion behind every pizza we create.
              </p>
            </div>
          </FadeIn>

          {/* Story Cards */}
          <div className="max-w-3xl mx-auto space-y-6 mb-20">
            {[
              {
                icon: Utensils,
                iconBg: "bg-primary/8",
                iconColor: "text-primary",
                title: "How It All Began",
                text: "Pizza Volante started in 2020 when the Reyes family decided to share their grandmother's secret pizza recipes with Baguio. What began as a small home kitchen operation quickly grew as word spread about our authentic Italian-Filipino fusion pizzas.",
              },
              {
                icon: Leaf,
                iconBg: "bg-accent/8",
                iconColor: "text-accent",
                title: "Our Philosophy",
                text: "We believe great pizza starts with great ingredients. Every pizza is made with hand-stretched dough, san marzano tomatoes, fresh mozzarella, and locally-sourced vegetables from Benguet farms.",
              },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.1}>
                <HoverCard>
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <h2 className="text-xl font-display font-semibold text-foreground pt-1">{card.title}</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-14">{card.text}</p>
                  </div>
                </HoverCard>
              </FadeIn>
            ))}
          </div>

          {/* Values */}
          <FadeIn>
            <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-8 text-center">Our Values</p>
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
                  <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-card h-full">
                    <div className={`w-12 h-12 rounded-xl ${val.bg} flex items-center justify-center mx-auto mb-4`}>
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
