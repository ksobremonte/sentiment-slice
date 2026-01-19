import PublicLayout from "@/components/layout/PublicLayout";

const menuItems = [
  {
    category: "Classic Pizzas",
    items: [
      { name: "Margherita", price: 299, description: "Fresh tomatoes, mozzarella, basil, olive oil" },
      { name: "Pepperoni", price: 349, description: "Classic pepperoni with mozzarella cheese" },
      { name: "Hawaiian", price: 329, description: "Ham, pineapple, mozzarella" },
      { name: "Four Cheese", price: 379, description: "Mozzarella, parmesan, gorgonzola, cheddar" },
    ],
  },
  {
    category: "Specialty Pizzas",
    items: [
      { name: "Volcano Special", price: 449, description: "Spicy chorizo, jalapeños, bell peppers, sriracha drizzle" },
      { name: "Baguio Garden", price: 399, description: "Fresh vegetables from Benguet farms" },
      { name: "Meat Lovers", price: 479, description: "Pepperoni, bacon, ham, ground beef, sausage" },
      { name: "Truffle Mushroom", price: 499, description: "Mixed mushrooms, truffle oil, parmesan" },
    ],
  },
  {
    category: "Sides & Drinks",
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
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Our <span className="text-gradient">Menu</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Handcrafted pizzas made with love and the finest ingredients. 
              All prices in Philippine Pesos (₱).
            </p>
          </div>

          {/* Menu Categories */}
          <div className="max-w-4xl mx-auto space-y-12">
            {menuItems.map((category) => (
              <div key={category.category}>
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b border-border">
                  {category.category}
                </h2>
                <div className="grid gap-4">
                  {category.items.map((item) => (
                    <div
                      key={item.name}
                      className="bg-card border border-border rounded-xl p-5 flex justify-between items-start gap-4 hover:border-primary/30 transition-colors"
                    >
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        ₱{item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MenuPage;
