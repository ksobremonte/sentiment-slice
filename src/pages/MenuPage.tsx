import PublicLayout from "@/components/layout/PublicLayout";
import { FadeIn, StaggerContainer, StaggerItem, HoverCard } from "@/components/ui/animated";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";

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
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-6">
          {/* Header */}
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center mb-16">
              <img src={pizzaVolanteLogo} alt="Pizza Volante" className="h-16 w-auto mx-auto mb-6" />
              <p className="text-xs font-semibold text-primary uppercase tracking-[0.2em] mb-3">Fresh & Handcrafted</p>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
                Our Menu
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Handcrafted pizzas made with love and the finest ingredients. All prices in ₱.
              </p>
            </div>
          </FadeIn>

          {/* Menu Categories */}
          <div className="max-w-4xl mx-auto space-y-10">
            {menuItems.map((category, catIdx) => (
              <FadeIn key={category.category} delay={catIdx * 0.1}>
                <div className="bg-secondary rounded-2xl p-8 md:p-10">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-secondary-foreground mb-6 flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    {category.category}
                  </h2>

                  <StaggerContainer className="space-y-3" staggerDelay={0.05}>
                    {category.items.map((item) => (
                      <StaggerItem key={item.name}>
                        <HoverCard>
                          <div className="bg-secondary-foreground/5 rounded-xl p-5 flex justify-between items-start gap-4 border border-secondary-foreground/8">
                            <div>
                              <h3 className="font-semibold text-secondary-foreground">{item.name}</h3>
                              <p className="text-sm text-secondary-foreground/50 mt-1">{item.description}</p>
                            </div>
                            <div className="bg-primary rounded-lg px-3 py-1.5 flex-shrink-0">
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
            <div className="max-w-2xl mx-auto text-center mt-12">
              <p className="text-muted-foreground text-sm bg-card rounded-xl p-6 shadow-card border border-border">
                📞 For orders: <span className="font-semibold text-primary">+63 912 345 6789</span>
                <br />
                <span className="text-xs mt-1 block text-muted-foreground/70">Prices may vary. Ask about our daily specials!</span>
              </p>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MenuPage;
