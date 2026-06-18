import { Pizza, Heart, Users, Award, Utensils, Leaf } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Seo from "@/components/Seo";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, ParallaxImage, ZoomImage,
} from "@/components/ui/animated";
import restaurantExterior from "@/assets/restaurant-exterior.jpg";
import restaurantInteriorReal from "@/assets/restaurant-interior-real.webp";
import foodSpread from "@/assets/food-spread.jpg";
import riceMeal from "@/assets/rice-meal.jpg";

const About = () => {
  return (
    <PublicLayout>
      {/* Hero — Real exterior photo */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        <img src={restaurantExterior} alt="Pizza Volante Baguio exterior" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="relative z-10 text-center px-6">
          <FadeIn>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.25em] mb-2">Our Story</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
              About Pizza Volante
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6">
          {/* Story with images */}
          <div className="max-w-5xl mx-auto mb-24">
            <FadeIn>
              <div className="text-center mb-14">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                  From Family Kitchen to
                  <span className="text-gradient block">Baguio's Favorite</span>
                </h2>
                <div className="section-divider mt-6" />
              </div>
            </FadeIn>

            {/* Story card with image — alternating layout */}
            <div className="space-y-8">
              <FadeIn>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card md:flex group">
                  <div className="md:w-2/5">
                    <ZoomImage
                      src={restaurantInteriorReal}
                      alt="Inside Pizza Volante"
                      className="h-56 md:h-full w-full"
                    />
                  </div>
                  <div className="md:w-3/5 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Utensils className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-display font-semibold text-foreground">How It All Began</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Pizza Volante started in 2020 when the Reyes family decided to share their grandmother's secret pizza recipes with Baguio. What began as a small home kitchen operation quickly grew as word spread about our authentic Italian-Filipino fusion pizzas. Today, we're proud to serve hundreds of happy customers every week.
                    </p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card md:flex md:flex-row-reverse group">
                  <div className="md:w-2/5">
                    <ZoomImage
                      src={riceMeal}
                      alt="Our fresh ingredients"
                      className="h-56 md:h-full w-full"
                    />
                  </div>
                  <div className="md:w-3/5 p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/8 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Leaf className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="text-xl font-display font-semibold text-foreground">Our Philosophy</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      We believe great food starts with great ingredients. Every pizza is made with hand-stretched dough, san marzano tomatoes, fresh mozzarella, and locally-sourced vegetables from Benguet farms. We never compromise on quality — every dish is made with the same care as if we were cooking for our own family.
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Full-width food image break */}
          <FadeIn>
            <ZoomImage
              src={foodSpread}
              alt="Our food selection"
              className="rounded-2xl shadow-warm max-w-5xl mx-auto h-48 md:h-72 mb-24"
            />
          </FadeIn>

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
