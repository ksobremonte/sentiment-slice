import { Star, MessageSquare } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import Seo from "@/components/Seo";
import PublicReviewsList from "@/components/public/PublicReviewsList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePublicReviewStats } from "@/hooks/usePublicReviewStats";

const ReadReviews = () => {
  return (
    <PublicLayout>
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Star className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              What Our Customers <span className="text-primary">Say</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Real feedback from our valued customers at Pizza Volante.
            </p>
            <Link to="/reviews">
              <Button size="lg" className="rounded-xl font-semibold">
                <MessageSquare className="w-5 h-5 mr-2" />
                Leave a Review
              </Button>
            </Link>
          </div>

          {/* Reviews List */}
          <div className="max-w-3xl mx-auto">
            <PublicReviewsList />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ReadReviews;
