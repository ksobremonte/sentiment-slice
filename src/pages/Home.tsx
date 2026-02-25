import { Star, Truck, ChefHat, Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import { FadeIn, StaggerContainer, StaggerItem, HoverCard, AnimatedButton } from "@/components/ui/animated";
import { motion } from "framer-motion";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const Home = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden bg-gradient-hero">
        {/* Decorative circles */}
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-8 tracking-wide uppercase">
                <ChefHat className="w-4 h-4" />
                <span>Baguio's Favorite Since 2000</span>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
                Authentic Pizza
                <br />
                <span className="text-gradient">in the City of Pines</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                Traditional recipes, fresh local ingredients, and wood-fired perfection. 
                Every pizza handcrafted with love.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <AnimatedButton>
                  <Button asChild size="lg" className="px-8 py-6 text-base rounded-xl shadow-warm">
                    <Link to="/menu">
                      View Our Menu
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </AnimatedButton>
                <AnimatedButton>
                  <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base rounded-xl">
                    <Link to="/read-reviews">
                      <Star className="w-4 h-4 mr-2" />
                      Read Reviews
                    </Link>
                  </Button>
                </AnimatedButton>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                The Pizza Volante Difference
              </h2>
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Star,
                title: "Premium Quality",
                desc: "Only the finest ingredients sourced locally from Benguet farms and imported from Italy.",
                color: "text-primary",
                bg: "bg-primary/8",
              },
              {
                icon: Flame,
                title: "Wood-Fired Fresh",
                desc: "Every pizza is baked to order in our traditional wood-fired oven for that authentic taste.",
                color: "text-accent",
                bg: "bg-accent/8",
              },
              {
                icon: Truck,
                title: "Fast Delivery",
                desc: "Free delivery within Baguio City for orders above ₱500. Hot pizza at your doorstep!",
                color: "text-success",
                bg: "bg-success/8",
              },
            ].map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverCard className="h-full">
                  <div className="bg-card rounded-2xl p-8 shadow-card border border-border h-full text-center">
                    <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mx-auto mb-5`}>
                      <feature.icon className={`w-7 h-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </HoverCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="bg-secondary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-full opacity-5">
                <div className="absolute top-10 left-10 w-40 h-40 rounded-full border border-secondary-foreground" />
                <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border border-secondary-foreground" />
              </div>

              <div className="relative">
                <motion.img
                  src={pizzaVolanteLogo}
                  alt="Pizza Volante"
                  className="h-20 w-auto mx-auto mb-8"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
                <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-4">
                  Love Our Pizza?
                </h2>
                <p className="text-secondary-foreground/60 mb-10 max-w-md mx-auto">
                  Your feedback helps us serve you better. Share your experience with us.
                </p>
                <AnimatedButton>
                  <Button
                    asChild
                    size="lg"
                    className="px-10 py-6 text-base rounded-xl shadow-warm"
                  >
                    <Link to="/reviews">
                      <Star className="w-4 h-4 mr-2" />
                      Leave a Review
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

export default Home;
