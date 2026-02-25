import PublicLayout from "@/components/layout/PublicLayout";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, ParallaxImage,
} from "@/components/ui/animated";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";
import heroPizza from "@/assets/hero-pizza.jpg";

const menuItems = [
  {
    category: "Classic Pizzas",
    icon: "🍕",
    items: [
      { name: "Margherita", price: 299, description: "Fresh tomatoes, mozzarella, basil, olive oil" },
      { name: "Pepperoni", price: 349, description: "Classic pepperoni with mozzarella cheese" },
      { name: "Hawaiian", price: 329, description: "Ham, pineapple, mozzarella" },
      { name: "Four Cheese", price: 379, description: "Mozzarella, parmesan, gorgonzola, cheddar" },
    ],
  },
  {
    category: "Specialty Pizzas",
    icon: "⭐",
    items: [
      { name: "Volcano Special", price: 449, description: "Spicy chorizo, jalapeños, bell peppers, sriracha drizzle" },
      { name: "Baguio Garden", price: 399, description: "Fresh vegetables from Benguet farms" },
      { name: "Meat Lovers", price: 479, description: "Pepperoni, bacon, ham, ground beef, sausage" },
      { name: "Truffle Mushroom", price: 499, description: "Mixed mushrooms, truffle oil, parmesan" },
    ],
  },
  {
    category: "Sides & Drinks",
    icon: "🥤",
    items: [
      { name: "Garlic Breadsticks", price: 129, description: "6 pieces with marinara dip" },
      { name: "Caesar Salad", price: 159, description: "Romaine, croutons, parmesan, caesar dressing" },
      { name: "Soft Drinks", price: 49, description: "Coke, Sprite, Royal" },
      { name: "Iced Tea", price: 59, description: "House-brewed with calamansi" },
    ],
  },
];

const MenuPage = () => {
  return (
    <PublicLayout>
      {/* Menu Hero */}
      <section className="relative h-[40vh] md:h-[45vh] flex items-center justify-center overflow-hidden">
        <ParallaxImage
          src={heroPizza}
          alt="Our artisan pizzas"
          className="absolute inset-0"
        />
        <div className="relative z-10 text-center px-6">
          <FadeIn>
            <img src={pizzaVolanteLogo} alt="Pizza Volante" className="h-14 w-auto mx-auto mb-4 drop-shadow-2xl" />
            <p className="text-xs font-semibold text-white/60 uppercase tracking-[0.25em] mb-2">Fresh & Handcrafted</p>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-lg">
              Our Menu
            </h1>
          </FadeIn>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-6">
          {/* Menu Categories */}
          <div className="max-w-4xl mx-auto space-y-10">
            {menuItems.map((category, catIdx) => (
              <FadeIn key={category.category} delay={catIdx * 0.1}>
                <div className="bg-secondary rounded-2xl p-8 md:p-10 relative overflow-hidden">
                  {/* Subtle decorative */}
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-secondary-foreground/[0.02] -translate-y-1/2 translate-x-1/2" />

                  <h2 className="text-xl md:text-2xl font-display font-bold text-secondary-foreground mb-8 flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    {category.category}
                    <div className="flex-1 h-px bg-secondary-foreground/10 ml-3" />
                  </h2>

                  <StaggerContainer className="space-y-3" staggerDelay={0.05}>
                    {category.items.map((item) => (
                      <StaggerItem key={item.name}>
                        <HoverCard>
                          <div className="bg-secondary-foreground/5 rounded-xl p-5 flex justify-between items-center gap-4 border border-secondary-foreground/6 group">
                            <div>
                              <h3 className="font-semibold text-secondary-foreground group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                              <p className="text-sm text-secondary-foreground/45 mt-0.5">{item.description}</p>
                            </div>
                            <div className="bg-primary/90 rounded-lg px-3 py-1.5 flex-shrink-0 group-hover:bg-primary group-hover:shadow-glow transition-all duration-300">
                              <span className="text-sm font-bold text-primary-foreground whitespace-nowrap">
                                ₱{item.price}
                              </span>
                            </div>
                          </div>
                        </HoverCard>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Note */}
          <FadeIn delay={0.3}>
            <div className="max-w-2xl mx-auto text-center mt-14">
              <p className="text-muted-foreground text-sm bg-card rounded-xl p-6 shadow-card border border-border">
                📞 For orders: <span className="font-semibold text-primary">+63 912 345 6789</span>
                <br />
                <span className="text-xs mt-1 block text-muted-foreground/60">Prices may vary. Ask about our daily specials!</span>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MenuPage;
