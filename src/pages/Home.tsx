import { Star, Clock, Truck, ChefHat, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const Home = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Warm gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Decorative badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 shadow-subtle">
              <ChefHat className="w-5 h-5" />
              <span>Baguio's Favorite Pizzeria Since 2020</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-8 leading-tight">
              Authentic Italian Pizza in the
              <span className="block text-primary mt-2">City of Pines</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the perfect blend of traditional recipes and fresh local ingredients. 
              Every pizza is handcrafted with love and baked to perfection in our wood-fired oven.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl shadow-warm">
                <Link to="/menu">
                  View Our Menu
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary/10 font-semibold px-8 py-6 text-lg rounded-xl">
                <Link to="/reviews">
                  <Star className="w-5 h-5 mr-2" />
                  Read Reviews
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/80">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Why Choose Pizza Volante?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We bring the authentic taste of Italy to Baguio with every slice
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-warm transition-shadow duration-300 border border-border text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">Premium Quality</h3>
              <p className="text-muted-foreground leading-relaxed">
                Only the finest ingredients sourced locally from Benguet farms and imported from Italy.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-warm transition-shadow duration-300 border border-border text-center">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Flame className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">Wood-Fired Fresh</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every pizza is baked to order in our traditional wood-fired oven for that authentic taste.
              </p>
            </div>
            
            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-warm transition-shadow duration-300 border border-border text-center">
              <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <Truck className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-3">Fast Delivery</h3>
              <p className="text-muted-foreground leading-relaxed">
                Free delivery within Baguio City for orders above ₱500. Hot pizza at your doorstep!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-secondary rounded-3xl p-10 md:p-16 text-center shadow-warm relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-2 border-secondary-foreground/10 opacity-50" />
            <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full border-2 border-secondary-foreground/10 opacity-50" />
            
            <div className="relative">
              <img src={pizzaVolanteLogo} alt="Pizza Volante" className="h-24 w-auto mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-6">
                Love Our Pizza? Share Your Experience!
              </h2>
              <p className="text-secondary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                Your feedback helps us serve you better. Leave a review and let us know how we're doing.
              </p>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-6 text-lg rounded-xl shadow-warm">
                <Link to="/reviews">
                  <Star className="w-5 h-5 mr-2" />
                  Leave a Review
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
