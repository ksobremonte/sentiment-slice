import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";

const SAMPLE_REVIEWS = [
  { name: "Maria Santos", email: "maria@example.com", rating: 5, feedback: "The pizza was absolutely incredible! Perfectly crispy crust with fresh toppings. Best pizza I've had in years.", sentiment: "positive", sentiment_reason: "Highly positive about pizza quality and crust", sentiment_keywords: ["incredible", "crispy", "fresh"] },
  { name: "Juan dela Cruz", email: "juan@example.com", rating: 4, feedback: "Great pasta dishes and friendly staff. The carbonara was creamy and well-seasoned. Will definitely come back.", sentiment: "positive", sentiment_reason: "Positive about pasta quality and service", sentiment_keywords: ["great", "friendly", "creamy"] },
  { name: "Anna Reyes", email: "anna@example.com", rating: 2, feedback: "Waited 45 minutes for our order. The food was okay but the long wait time ruined the experience.", sentiment: "negative", sentiment_reason: "Negative due to excessive wait time", sentiment_keywords: ["waited", "long", "ruined"] },
  { name: "Carlos Garcia", email: "carlos@example.com", rating: 5, feedback: "Amazing ambiance and the wood-fired pizza is to die for. The margherita was perfection.", sentiment: "positive", sentiment_reason: "Very positive about ambiance and pizza", sentiment_keywords: ["amazing", "perfection", "wood-fired"] },
  { name: "Lisa Tan", email: "lisa@example.com", rating: 3, feedback: "Food was decent but nothing extraordinary. Prices are a bit steep for the portion sizes.", sentiment: "neutral", sentiment_reason: "Mixed feelings about value for money", sentiment_keywords: ["decent", "steep", "portions"] },
  { name: "Mark Rivera", email: "mark@example.com", rating: 1, feedback: "Very disappointed with the service. Our order was wrong twice and the manager was unhelpful.", sentiment: "negative", sentiment_reason: "Negative about service quality and management", sentiment_keywords: ["disappointed", "wrong", "unhelpful"] },
  { name: "Sofia Cruz", email: "sofia@example.com", rating: 5, feedback: "Best Italian restaurant in town! The tiramisu dessert was heavenly. Perfect date night spot.", sentiment: "positive", sentiment_reason: "Highly positive about food and atmosphere", sentiment_keywords: ["best", "heavenly", "perfect"] },
  { name: "David Lee", email: "david@example.com", rating: 4, feedback: "Solid menu options and consistent quality. The garlic bread is a must-try appetizer.", sentiment: "positive", sentiment_reason: "Positive about menu variety and quality", sentiment_keywords: ["solid", "consistent", "must-try"] },
  { name: "Rachel Gomez", email: "rachel@example.com", rating: 3, feedback: "The restaurant was quite noisy during peak hours. Food quality is good though. Average dining experience.", sentiment: "neutral", sentiment_reason: "Mixed review about noise vs food quality", sentiment_keywords: ["noisy", "average", "good"] },
  { name: "Miguel Torres", email: "miguel@example.com", rating: 2, feedback: "The pizza arrived cold and the cheese was barely melted. Expected much better from the reviews.", sentiment: "negative", sentiment_reason: "Negative about food temperature and quality", sentiment_keywords: ["cold", "barely", "expected"] },
  { name: "Emma Villanueva", email: "emma@example.com", rating: 5, feedback: "Wonderful experience from start to finish. The staff made us feel welcome and the food was outstanding.", sentiment: "positive", sentiment_reason: "Very positive about overall experience", sentiment_keywords: ["wonderful", "welcome", "outstanding"] },
  { name: "James Aquino", email: "james@example.com", rating: 4, feedback: "Really enjoyed the pepperoni pizza and the house salad. Good value for the quality you get.", sentiment: "positive", sentiment_reason: "Positive about specific dishes and value", sentiment_keywords: ["enjoyed", "good", "quality"] },
  { name: "Patricia Lim", email: "patricia@example.com", rating: 3, feedback: "The pasta was slightly overcooked but the sauce was flavorful. Decent option for a quick meal.", sentiment: "neutral", sentiment_reason: "Mixed feedback on pasta preparation", sentiment_keywords: ["overcooked", "flavorful", "decent"] },
  { name: "Roberto Mendoza", email: "roberto@example.com", rating: 1, feedback: "Found a hair in my food and the staff didn't apologize properly. Hygiene standards need improvement.", sentiment: "negative", sentiment_reason: "Negative about hygiene and staff response", sentiment_keywords: ["hair", "hygiene", "improvement"] },
  { name: "Christine Bautista", email: "christine@example.com", rating: 5, feedback: "The four-cheese pizza is divine! Generous toppings and the dough is perfectly chewy. Highly recommend!", sentiment: "positive", sentiment_reason: "Highly positive about pizza quality", sentiment_keywords: ["divine", "generous", "recommend"] },
  { name: "Andrew Flores", email: "andrew@example.com", rating: 4, feedback: "Cozy atmosphere with authentic Italian flavors. The bruschetta appetizer was fresh and delicious.", sentiment: "positive", sentiment_reason: "Positive about atmosphere and food authenticity", sentiment_keywords: ["cozy", "authentic", "delicious"] },
  { name: "Diana Pascual", email: "diana@example.com", rating: 2, feedback: "The delivery took over an hour and the food was lukewarm. Online ordering system needs work.", sentiment: "negative", sentiment_reason: "Negative about delivery time and food temperature", sentiment_keywords: ["delivery", "lukewarm", "hour"] },
  { name: "Kevin Ramos", email: "kevin@example.com", rating: 4, feedback: "Great lunch spot with reasonable prices. The combo meals are worth it. Service was prompt and polite.", sentiment: "positive", sentiment_reason: "Positive about value, combos, and service", sentiment_keywords: ["great", "reasonable", "prompt"] },
  { name: "Michelle Soriano", email: "michelle@example.com", rating: 3, feedback: "Menu could use more variety. The existing dishes are fine but I wish there were more vegetarian options.", sentiment: "neutral", sentiment_reason: "Neutral - wants more menu variety", sentiment_keywords: ["variety", "fine", "vegetarian"] },
  { name: "Alex Navarro", email: "alex@example.com", rating: 5, feedback: "Celebrated our anniversary here and it was magical. The staff arranged a special setup for us. Thank you!", sentiment: "positive", sentiment_reason: "Very positive about special occasion service", sentiment_keywords: ["magical", "special", "celebrated"] },
];

export const useSeedReviews = (reviewCount: number, isLoading: boolean) => {
  const seeding = useRef(false);
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  useEffect(() => {
    if (isLoading || seeding.current || reviewCount > 0 || !user) return;
    seeding.current = true;

    const seed = async () => {
      console.log("[useSeedReviews] Database empty, seeding 20 sample reviews...");
      const { error } = await supabase.from("reviews").insert(SAMPLE_REVIEWS);
      if (error) {
        console.error("[useSeedReviews] Seed error:", error);
        seeding.current = false;
        return;
      }
      console.log("[useSeedReviews] Seeded 20 sample reviews successfully");
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    };

    seed();
  }, [reviewCount, isLoading, user, queryClient]);
};
