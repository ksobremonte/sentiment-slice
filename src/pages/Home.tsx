import { Pizza, Star, Clock, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";

const Home = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Pizza className="w-4 h-4" />
              Baguio's Favorite Pizza
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Authentic Italian Pizza in the
              <span className="text-gradient"> City of Pines</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the perfect blend of traditional recipes and fresh local ingredients. 
              Every pizza is handcrafted with love and baked to perfection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground">
                <Link to="/menu">View Our Menu</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/reviews">Read Reviews</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Premium Quality</h3>
              <p className="text-muted-foreground">
                Only the finest ingredients sourced locally and imported from Italy.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Fast Service</h3>
              <p className="text-muted-foreground">
                Quick preparation without compromising on quality or taste.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Free Delivery</h3>
              <p className="text-muted-foreground">
                Free delivery within Baguio City for orders above ₱500.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-primary rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Love Our Pizza? Share Your Experience!
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              Your feedback helps us serve you better. Leave a review and let us know how we're doing.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/reviews">Leave a Review</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
