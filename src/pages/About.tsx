import { Pizza, Heart, Users, Award } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";

const About = () => {
  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-gradient">Story</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              From a small family kitchen to Baguio's beloved pizzeria, 
              discover the passion behind every pizza we create.
            </p>
          </div>

          {/* Story */}
          <div className="max-w-4xl mx-auto space-y-8 mb-16">
            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">How It All Began</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pizza Volante started in 2020 when the Reyes family decided to share their 
                grandmother's secret pizza recipes with Baguio. What began as a small home 
                kitchen operation quickly grew as word spread about our authentic Italian-Filipino 
                fusion pizzas. Today, we're proud to serve hundreds of happy customers every week.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Our Philosophy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe great pizza starts with great ingredients. Every pizza is made with 
                hand-stretched dough, san marzano tomatoes, fresh mozzarella, and locally-sourced 
                vegetables. We never compromise on quality, and every pizza is made to order with 
                the same care and attention as if we were cooking for our own family.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Pizza className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quality First</h3>
              <p className="text-sm text-muted-foreground">Premium ingredients in every bite</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Made with Love</h3>
              <p className="text-sm text-muted-foreground">Family recipes, homemade taste</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Community</h3>
              <p className="text-sm text-muted-foreground">Supporting local suppliers</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Excellence</h3>
              <p className="text-sm text-muted-foreground">Striving for perfection daily</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
