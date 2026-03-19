import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <img 
          src={pizzaVolanteLogo} 
          alt="Pizza Volante Logo" 
          className="h-28 w-auto mx-auto mb-6"
        />
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! This page got lost in delivery.
        </p>
        <Link to="/pv-dashboard">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
