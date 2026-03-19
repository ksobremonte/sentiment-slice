import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

const DashboardHeader = () => {
  return (
    <header className="border-b-2 border-primary/20 bg-cream-warm/95 backdrop-blur-sm sticky top-0 z-50 shadow-subtle">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={pizzaVolanteLogo} 
                alt="Pizza Volante Logo" 
                className="h-16 md:h-20 w-auto"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-3 border-card shadow-subtle" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-brand text-3xl md:text-4xl text-foreground leading-tight">
                Pizza Volante
              </h1>
              <p className="text-xs text-muted-foreground font-medium tracking-wide">Baguio City</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">Sentiment Dashboard</p>
              <p className="text-xs text-muted-foreground">AI-Powered Analytics</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-subtle">
              <span className="text-sm font-bold text-secondary-foreground">PV</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
