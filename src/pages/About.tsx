import { Pizza, Heart, Users, Award, Utensils, Leaf } from "lucide-react";
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
              From a small family kitchen to Baguio's beloved pizzeria, 
              discover the passion behind every pizza we create.
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
                Pizza Volante started in 2020 when the Reyes family decided to share their 
                grandmother's secret pizza recipes with Baguio. What began as a small home 
                kitchen operation quickly grew as word spread about our authentic Italian-Filipino 
                fusion pizzas. Today, we're proud to serve hundreds of happy customers every week.
              </p>
            </div>

            <div className="bg-card border-2 border-border rounded-3xl p-8 md:p-10 shadow-card hover:shadow-warm transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground pt-2">Our Philosophy</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We believe great pizza starts with great ingredients. Every pizza is made with 
                hand-stretched dough, san marzano tomatoes, fresh mozzarella, and locally-sourced 
                vegetables from Benguet farms. We never compromise on quality, and every pizza is made to order with 
                the same care and attention as if we were cooking for our own family.
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
              <p className="text-sm text-muted-foreground">Family recipes, homemade taste</p>
            </div>
            
            <div className="bg-card border-2 border-border rounded-2xl p-8 text-center shadow-card hover:shadow-warm transition-all hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-5">
                <Users className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">Supporting local suppliers</p>
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
