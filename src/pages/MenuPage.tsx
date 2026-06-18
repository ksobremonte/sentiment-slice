import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/layout/PublicLayout";
import Seo from "@/components/Seo";
import {
  FadeIn, StaggerContainer, StaggerItem, HoverCard, ParallaxImage, AnimatedButton, ZoomImage,
} from "@/components/ui/animated";
import pizzaVolanteLogo from "@/assets/pizza-volante-logo.png";
import pizzaSupreme from "@/assets/pizza-supreme.webp";
import pizzaClassic from "@/assets/pizza-classic.webp";
import pastaDish from "@/assets/pasta-dish.webp";
import saladFresh from "@/assets/salad-fresh.webp";
import riceMeal from "@/assets/rice-meal.jpg";
import pizzaSlice from "@/assets/pizza-slice.webp";

// Each category now has a featured image
const menuItems = [
  {
    category: "Classic Pizzas",
    icon: "🍕",
    image: pizzaClassic,
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
    image: pizzaSupreme,
    items: [
      { name: "Volcano Special", price: 449, description: "Spicy chorizo, jalapeños, bell peppers, sriracha drizzle" },
      { name: "Baguio Garden", price: 399, description: "Fresh vegetables from Benguet farms" },
      { name: "Meat Lovers", price: 479, description: "Pepperoni, bacon, ham, ground beef, sausage" },
      { name: "Truffle Mushroom", price: 499, description: "Mixed mushrooms, truffle oil, parmesan" },
    ],
  },
  {
    category: "Pasta & Mains",
    icon: "🍝",
    image: pastaDish,
    items: [
      { name: "Seafood Pasta", price: 359, description: "Shrimp, clams, garlic bread, marinara" },
      { name: "Rice Meals", price: 259, description: "Choice of BBQ, fried chicken, or pork with fried rice" },
      { name: "Garlic Breadsticks", price: 129, description: "6 pieces with marinara dip" },
      { name: "Caesar Salad", price: 159, description: "Romaine, croutons, parmesan, caesar dressing" },
    ],
  },
  {
    category: "Sides & Drinks",
    icon: "🥤",
    image: saladFresh,
    items: [
      { name: "Pomelo Salad", price: 189, description: "Fresh pomelo with peanuts and vinaigrette" },
      { name: "Soft Drinks", price: 49, description: "Coke, Sprite, Royal" },
      { name: "Iced Tea", price: 59, description: "House-brewed with calamansi" },
      { name: "Coffee", price: 89, description: "Hot or iced, cappuccino, latte" },
    ],
  },
];

const MenuPage = () => {
  return (
    <PublicLayout>
      {/* Menu Hero — Real pizza close-up */}
      <section className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden">
        <img src={pizzaSlice} alt="Pizza Volante pizza" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
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
          {/* Menu Categories with food images */}
          <div className="max-w-5xl mx-auto space-y-12">
            {menuItems.map((category, catIdx) => (
              <FadeIn key={category.category} delay={catIdx * 0.08}>
                <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
                  {/* Category header with image */}
                  <div className="md:flex">
                    {/* Food image */}
                    <div className="md:w-2/5 relative">
                      <ZoomImage
                        src={category.image}
                        alt={category.category}
                        className="h-48 md:h-full md:min-h-[300px] w-full"
                      />
                      {/* Category label overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-5 md:hidden">
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.category}
                        </h2>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="md:w-3/5 p-6 md:p-8">
                      <h2 className="hidden md:flex text-xl md:text-2xl font-display font-bold text-foreground mb-6 items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        {category.category}
                        <div className="flex-1 h-px bg-border ml-3" />
                      </h2>

                      <StaggerContainer className="space-y-2" staggerDelay={0.04}>
                        {category.items.map((item) => (
                          <StaggerItem key={item.name}>
                            <HoverCard>
                              <div className="rounded-xl p-4 flex justify-between items-center gap-4 group hover:bg-muted/40 transition-colors duration-200">
                                <div>
                                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                                </div>
                                <div className="bg-primary rounded-lg px-3 py-1.5 flex-shrink-0 group-hover:shadow-glow transition-all duration-300">
                                  <span className="text-sm font-bold text-primary-foreground whitespace-nowrap">₱{item.price}</span>
                                </div>
                              </div>
                            </HoverCard>
                          </StaggerItem>
                        ))}
                      </StaggerContainer>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Order CTA */}
          <FadeIn delay={0.3}>
            <div className="max-w-3xl mx-auto text-center mt-16">
              <div className="bg-secondary rounded-2xl p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-secondary-foreground/[0.02] -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-xl font-display font-bold text-secondary-foreground mb-2">Ready to Order?</h3>
                <p className="text-secondary-foreground/50 mb-6 text-sm">Call us for dine-in reservations or delivery</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <AnimatedButton>
                    <a href="tel:+630744450777" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-glow btn-glow hover:bg-primary/90 transition-colors">
                      📞 Call +63 (074) 445-0777
                    </a>
                  </AnimatedButton>
                  <AnimatedButton>
                    <Link to="/contact" className="inline-flex items-center gap-2 border-2 border-secondary-foreground/20 text-secondary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-secondary-foreground/5 transition-colors">
                      Visit Us <ArrowRight className="w-4 h-4" />
                    </Link>
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MenuPage;
