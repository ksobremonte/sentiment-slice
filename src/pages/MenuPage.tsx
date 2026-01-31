import PublicLayout from "@/components/layout/PublicLayout";
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
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <img 
              src={pizzaVolanteLogo} 
              alt="Pizza Volante" 
              className="h-20 w-auto mx-auto mb-6"
            />
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Our <span className="text-primary">Menu</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Handcrafted pizzas made with love and the finest ingredients. 
              All prices in Philippine Pesos (₱).
            </p>
          </div>

          {/* Menu Categories - Chalkboard Style */}
          <div className="max-w-4xl mx-auto space-y-12">
            {menuItems.map((category) => (
              <div key={category.category} className="bg-secondary rounded-3xl p-8 md:p-10 shadow-warm">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-secondary-foreground mb-8 flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  {category.category}
                </h2>
                
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <div
                      key={item.name}
                      className="bg-secondary-foreground/5 backdrop-blur-sm rounded-2xl p-5 flex justify-between items-start gap-4 hover:bg-secondary-foreground/10 transition-colors border border-secondary-foreground/10"
                    >
                      <div>
                        <h3 className="font-display font-semibold text-lg text-secondary-foreground">{item.name}</h3>
                        <p className="text-sm text-secondary-foreground/70 mt-1">{item.description}</p>
                      </div>
                      <div className="bg-primary rounded-xl px-4 py-2 shadow-subtle">
                        <span className="text-lg font-bold text-primary-foreground whitespace-nowrap">
                          ₱{item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="max-w-2xl mx-auto text-center mt-12">
            <p className="text-muted-foreground text-sm bg-card rounded-2xl p-6 shadow-subtle border border-border">
              📞 For orders and reservations, call us at <span className="font-semibold text-primary">+63 912 345 6789</span>
              <br />
              <span className="text-xs mt-2 block">Prices may vary. Ask about our daily specials!</span>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MenuPage;
