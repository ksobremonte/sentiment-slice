import { Star, Truck, ChefHat, Flame, ArrowRight, Clock, Users, Pizza } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, AnimatedButton,
  ParallaxImage, AnimatedCounter, FloatingElement, RevealText, ZoomImage,
} from "@/components/ui/animated";
import { motion } from "framer-motion";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";
import foodSpread from "@/assets/food-spread.jpg";
import pizzaSupreme from "@/assets/pizza-supreme.jpg";
import restaurantExterior from "@/assets/restaurant-exterior.jpg";
import pizzaClassic from "@/assets/pizza-classic.jpg";
import pastaDish from "@/assets/pasta-dish.jpg";
import pizzaSlice from "@/assets/pizza-slice.jpg";
import saladFresh from "@/assets/salad-fresh.jpg";
import restaurantInteriorReal from "@/assets/restaurant-interior-real.jpg";

const Home = () => {
  return (
    <PublicLayout>
      {/* Hero Section — Full bleed with real food spread */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <ParallaxImage
          src={foodSpread}
          alt="Pizza Volante food spread"
          className="absolute inset-0"
        />

        <div className="container mx-auto px-6 relative z-10 text-center py-20">
          <FadeIn>
            <FloatingElement>
              <img
                src={pizzaVolanteLogo}
                alt="Pizza Volante"
                className="h-24 md:h-28 w-auto mx-auto mb-6 drop-shadow-2xl"
              />
            </FloatingElement>
          </FadeIn>

          <div className="overflow-hidden mb-3">
            <RevealText delay={0.2}>
              <span className="inline-block text-xs font-semibold text-white/90 uppercase tracking-[0.25em] bg-primary/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                🍕 Baguio's Favorite Since 2000
              </span>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-6 leading-[1.05] tracking-tight drop-shadow-lg">
              Authentic Italian
              <br />
              <span className="font-brand text-6xl md:text-8xl lg:text-9xl text-white/90">Pizza</span>
            </h1>
          </RevealText>

          <FadeIn delay={0.5}>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg mx-auto leading-relaxed">
              Wood-fired perfection, traditional recipes, and the finest ingredients — 
              in the heart of the City of Pines.
            </p>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AnimatedButton>
                <Button asChild size="lg" className="px-8 py-6 text-base rounded-xl shadow-glow btn-glow bg-primary hover:bg-primary/90">
                  <Link to="/menu">
                    View Our Menu
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </AnimatedButton>
              <AnimatedButton>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-base rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm">
                  <Link to="/read-reviews">
                    <Star className="w-4 h-4 mr-2" />
                    Read Reviews
                  </Link>
                </Button>
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-6">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: 25, suffix: "+", label: "Years Serving", icon: Clock },
              { value: 50000, suffix: "+", label: "Happy Customers", icon: Users },
              { value: 30, suffix: "+", label: "Menu Items", icon: Pizza },
              { value: 5, suffix: "★", label: "Average Rating", icon: Star },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="space-y-2">
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2.5} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Food Gallery — Real photos with hover zoom */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.25em] mb-3">From Our Kitchen</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                Made Fresh
                <span className="text-gradient block">Every Day</span>
              </h2>
              <div className="section-divider mt-6" />
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
            {[
              { src: pizzaSupreme, alt: "Supreme pizza", span: "md:col-span-2 md:row-span-2" },
              { src: pastaDish, alt: "Pasta dish", span: "" },
              { src: saladFresh, alt: "Fresh salad", span: "" },
              { src: pizzaClassic, alt: "Classic pizza", span: "" },
              { src: pizzaSlice, alt: "Pizza slice", span: "" },
            ].map((img, i) => (
              <StaggerItem key={img.alt} className={img.span}>
                <ZoomImage
                  src={img.src}
                  alt={img.alt}
                  className={`rounded-2xl shadow-card ${img.span.includes("row-span-2") ? "h-full min-h-[280px] md:min-h-[400px]" : "aspect-square"}`}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.25em] mb-3">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                The Pizza Volante Difference
              </h2>
              <div className="section-divider mt-6" />
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Star, title: "Premium Quality", desc: "Only the finest ingredients sourced locally from Benguet farms and imported from Italy.", color: "text-primary", bg: "bg-primary/8" },
              { icon: Flame, title: "Wood-Fired Fresh", desc: "Every pizza is baked to order in our traditional wood-fired oven for that authentic taste.", color: "text-accent", bg: "bg-accent/8" },
              { icon: Truck, title: "Fast Delivery", desc: "Free delivery within Baguio City for orders above ₱500. Hot pizza at your doorstep!", color: "text-success", bg: "bg-success/8" },
            ].map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverCard className="h-full">
                  <div className="bg-card rounded-2xl p-8 shadow-card border border-border h-full text-center group">
                    <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
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

      {/* Interior Parallax — Real restaurant photo */}
      <section className="relative h-[50vh] md:h-[60vh]">
        <ParallaxImage
          src={restaurantInteriorReal}
          alt="Inside Pizza Volante Baguio"
          className="absolute inset-0"
        />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <FadeIn>
            <div className="max-w-2xl">
              <p className="font-brand text-4xl md:text-5xl text-white/90 mb-4 drop-shadow-lg">
                Benvenuti
              </p>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
                A Taste of Italy in Baguio
              </h2>
              <p className="text-white/70 max-w-md mx-auto mb-8">
                Step into our warm, rustic pizzeria and enjoy authentic flavors with a view.
              </p>
              <AnimatedButton>
                <Button asChild size="lg" className="px-8 py-6 text-base rounded-xl shadow-glow btn-glow">
                  <Link to="/about">
                    Our Story
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </AnimatedButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="bg-secondary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]">
                <div className="absolute top-10 left-10 w-40 h-40 rounded-full border border-secondary-foreground" />
                <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border border-secondary-foreground" />
              </div>

              <div className="relative">
                <motion.img
                  src={pizzaVolanteLogo}
                  alt="Pizza Volante"
                  className="h-16 w-auto mx-auto mb-8"
                  whileHover={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-xs font-semibold text-secondary-foreground/40 uppercase tracking-[0.25em] mb-3">
                  We'd Love Your Feedback
                </p>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-4">
                  Love Our Pizza?
                </h2>
                <p className="text-secondary-foreground/50 mb-10 max-w-md mx-auto">
                  Your reviews help us serve you better and make every pizza even more perfect.
                </p>
                <AnimatedButton>
                  <Button asChild size="lg" className="px-10 py-6 text-base rounded-xl shadow-glow btn-glow">
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
