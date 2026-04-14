import { Star, Truck, ChefHat, Flame, ArrowRight, Clock, Users, Pizza, MapPin, MessageSquare, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicReviewStats } from "@/hooks/usePublicReviewStats";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, AnimatedButton,
  ParallaxImage, AnimatedCounter, FloatingElement, RevealText, ZoomImage,
} from "@/components/ui/animated";
import { motion } from "framer-motion";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";
import foodSpread from "@/assets/food-spread.jpg";
const heroPizza = "/images/hero-pizza.webp";
import pizzaSupreme from "@/assets/pizza-supreme.webp";
import restaurantExterior from "@/assets/restaurant-exterior.jpg";
import pizzaClassic from "@/assets/pizza-classic.webp";
import pastaDish from "@/assets/pasta-dish.webp";
import pizzaSlice from "@/assets/pizza-slice.webp";
import saladFresh from "@/assets/salad-fresh.webp";
import restaurantInteriorReal from "@/assets/restaurant-interior-real.webp";
import pastaSpread from "@/assets/pasta-spread.webp";
import foodTable from "@/assets/food-table.webp";
import pizzaRiceMeal from "@/assets/pizza-rice-meal.webp";

const Home = () => {
  const { data: liveStats } = usePublicReviewStats();
  const stats = liveStats ?? { total: 0, positivePct: 0, avgRating: 0, activeUsers: 0 };

  return (
    <PublicLayout>
      {/* ─── HERO ─── Full-bleed cinematic hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <img
            src={heroPizza}
            alt="Delicious Pizza Volante pizza"
            className="absolute inset-0 w-full h-full object-cover"
            // @ts-ignore
            fetchpriority="high"
            width={1454}
            height={1024}
          />
        </motion.div>
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/15 z-[1]" />

        <div className="container mx-auto px-6 relative z-10 text-center py-20">
          <FadeIn>
            <FloatingElement>
              <img
                src={pizzaVolanteLogo}
                alt="Pizza Volante"
                className="h-20 md:h-24 w-auto mx-auto mb-8 drop-shadow-2xl"
              />
            </FloatingElement>
          </FadeIn>

          <div className="overflow-hidden mb-4">
            <RevealText delay={0.2}>
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/90 uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/15">
                <MapPin className="w-3.5 h-3.5" />
                Baguio City's Favorite Since 2000
              </span>
            </RevealText>
          </div>

          <RevealText delay={0.3}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white mb-2 leading-[1] tracking-tight">
              Authentic Italian
            </h1>
          </RevealText>
          <RevealText delay={0.4}>
            <p className="font-brand text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-white/95 mb-6 leading-[1]">
              Pizza
            </p>
          </RevealText>

          <FadeIn delay={0.55}>
            <p className="text-base md:text-lg text-white/70 mb-10 max-w-md mx-auto leading-relaxed font-body">
              Wood-fired perfection and traditional recipes —
              crafted with the finest ingredients in the City of Pines.
            </p>
          </FadeIn>

          <FadeIn delay={0.65}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <AnimatedButton>
                <Button asChild size="lg" className="px-10 py-6 text-base rounded-full shadow-glow btn-glow bg-primary hover:bg-primary/90 font-semibold">
                  <Link to="/menu">
                    View Our Menu
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </AnimatedButton>
              <AnimatedButton>
                <Button asChild variant="outline" size="lg" className="px-10 py-6 text-base rounded-full border-white/25 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm font-semibold">
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
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-7 h-11 border-2 border-white/25 rounded-full flex justify-center pt-2.5">
            <div className="w-1 h-2.5 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-14 bg-card border-y border-border relative">
        <div className="absolute inset-0 brick-overlay" />
        <div className="container mx-auto px-6 relative">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { value: stats.total, suffix: "", label: "Reviews Collected", icon: MessageSquare },
              { value: stats.positivePct, suffix: "%", label: "Positive Feedback", icon: ThumbsUp },
              { value: stats.activeUsers, suffix: "", label: "Active Users", icon: Users },
              { value: stats.avgRating, suffix: "★", label: "Average Rating", icon: Star },
            ].map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-primary/8 flex items-center justify-center mx-auto mb-2">
                    <stat.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2.5} />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-[0.2em]">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── FOOD GALLERY ─── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.3em] mb-3">From Our Kitchen</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">
                Made Fresh
                <span className="text-gradient block mt-1">Every Single Day</span>
              </h2>
              <div className="section-divider mt-6" />
            </div>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto auto-rows-[180px] md:auto-rows-[220px]">
            {[
              { src: pizzaSupreme, alt: "Supreme pizza", span: "md:col-span-2 md:row-span-2" },
              { src: pastaDish, alt: "Pasta dish", span: "" },
              { src: saladFresh, alt: "Fresh salad", span: "" },
              { src: pastaSpread, alt: "Pasta spread", span: "" },
              { src: foodTable, alt: "Food table spread", span: "" },
              { src: pizzaClassic, alt: "Classic pizza", span: "md:col-span-2" },
              { src: pizzaRiceMeal, alt: "Pizza and rice meal", span: "" },
              { src: pizzaSlice, alt: "Pizza slice", span: "" },
            ].map((img) => (
              <StaggerItem key={img.alt} className={img.span}>
                <ZoomImage
                  src={img.src}
                  alt={img.alt}
                  className="rounded-2xl shadow-card h-full w-full"
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 bg-muted/40">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.3em] mb-3">Why Choose Us</p>
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
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300`}>
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

      {/* ─── INTERIOR PARALLAX ─── */}
      <section className="relative h-[55vh] md:h-[65vh] overflow-hidden">
        <img
          src={restaurantInteriorReal}
          alt="Inside Pizza Volante Baguio"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          width={1920}
          height={879}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
          <FadeIn>
            <div className="max-w-2xl">
              <p className="font-brand text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">
                Benvenuti
              </p>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
                A Taste of Italy in Baguio
              </h2>
              <p className="text-white/60 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
                Step into our warm, rustic pizzeria and enjoy authentic flavors with a view.
              </p>
              <AnimatedButton>
                <Button asChild size="lg" className="px-10 py-6 text-base rounded-full shadow-glow btn-glow">
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

      {/* ─── CTA ─── */}
      <section className="py-28">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="bg-secondary rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.04]">
                <div className="absolute top-10 left-10 w-40 h-40 rounded-full border border-secondary-foreground" />
                <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border border-secondary-foreground" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-secondary-foreground" />
              </div>

              <div className="relative">
                <motion.img
                  src={pizzaVolanteLogo}
                  alt="Pizza Volante"
                  className="h-16 w-auto mx-auto mb-8"
                  whileHover={{ rotate: [0, -3, 3, 0] }}
                  transition={{ duration: 0.5 }}
                />
                <p className="text-[11px] font-semibold text-secondary-foreground/40 uppercase tracking-[0.3em] mb-3">
                  We'd Love Your Feedback
                </p>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-4">
                  Love Our Pizza?
                </h2>
                <p className="text-secondary-foreground/50 mb-10 max-w-md mx-auto text-sm leading-relaxed">
                  Your reviews help us serve you better and make every pizza even more perfect.
                </p>
                <AnimatedButton>
                  <Button asChild size="lg" className="px-10 py-6 text-base rounded-full shadow-glow btn-glow">
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
