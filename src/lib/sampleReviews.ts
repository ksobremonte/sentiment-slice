type SampleReview = {
  name: string;
  email: string;
  rating: number;
  feedback: string;
  sentiment: "positive" | "neutral" | "negative";
  sentiment_reason: string;
  sentiment_keywords: string[];
  language: string;
  approved: boolean;
};

const SAMPLE_FEEDBACK: Omit<SampleReview, "name" | "email">[] = [
  { rating: 5, feedback: "Amazing wood-fired pizza and super friendly staff.", sentiment: "positive", sentiment_reason: "Strong praise for food and service", sentiment_keywords: ["amazing", "friendly", "pizza"], language: "en", approved: true },
  { rating: 4, feedback: "Great flavor overall, though service was slightly slow.", sentiment: "positive", sentiment_reason: "Mostly positive with minor service delay", sentiment_keywords: ["great", "flavor", "slow"], language: "en", approved: true },
  { rating: 2, feedback: "Order arrived late and food was lukewarm.", sentiment: "negative", sentiment_reason: "Late delivery and poor food temperature", sentiment_keywords: ["late", "lukewarm", "delivery"], language: "en", approved: true },
  { rating: 5, feedback: "Best pasta in town, creamy and perfectly seasoned.", sentiment: "positive", sentiment_reason: "Very positive feedback on pasta quality", sentiment_keywords: ["best", "creamy", "pasta"], language: "en", approved: true },
  { rating: 3, feedback: "Decent meal, but portions could be bigger.", sentiment: "neutral", sentiment_reason: "Balanced feedback with value concern", sentiment_keywords: ["decent", "portions", "value"], language: "en", approved: true },
  { rating: 1, feedback: "Wrong order twice and no apology from staff.", sentiment: "negative", sentiment_reason: "Severe service issue with poor handling", sentiment_keywords: ["wrong", "order", "apology"], language: "en", approved: true },
  { rating: 5, feedback: "Fantastic ambiance and delicious margherita pizza.", sentiment: "positive", sentiment_reason: "Strong praise for atmosphere and pizza", sentiment_keywords: ["fantastic", "ambiance", "margherita"], language: "en", approved: true },
  { rating: 4, feedback: "Fresh ingredients and consistent quality every visit.", sentiment: "positive", sentiment_reason: "Positive consistency feedback", sentiment_keywords: ["fresh", "consistent", "quality"], language: "en", approved: true },
  { rating: 3, feedback: "A bit noisy during dinner rush, food was okay.", sentiment: "neutral", sentiment_reason: "Mixed experience due to noise", sentiment_keywords: ["noisy", "dinner", "okay"], language: "en", approved: true },
  { rating: 2, feedback: "Pizza came cold and cheese was barely melted.", sentiment: "negative", sentiment_reason: "Negative feedback on preparation quality", sentiment_keywords: ["cold", "cheese", "melted"], language: "en", approved: true },
  { rating: 5, feedback: "Outstanding service and excellent dessert selection.", sentiment: "positive", sentiment_reason: "Very positive service and dessert feedback", sentiment_keywords: ["outstanding", "service", "dessert"], language: "en", approved: true },
  { rating: 4, feedback: "Good value combo meals and quick service.", sentiment: "positive", sentiment_reason: "Positive value and speed feedback", sentiment_keywords: ["value", "combo", "quick"], language: "en", approved: true },
  { rating: 3, feedback: "Sauce was flavorful but pasta slightly overcooked.", sentiment: "neutral", sentiment_reason: "Mixed food quality notes", sentiment_keywords: ["flavorful", "pasta", "overcooked"], language: "en", approved: true },
  { rating: 1, feedback: "Found hygiene issues and staff response was poor.", sentiment: "negative", sentiment_reason: "Serious hygiene and response concern", sentiment_keywords: ["hygiene", "poor", "staff"], language: "en", approved: true },
  { rating: 5, feedback: "Four-cheese pizza was rich, balanced, and memorable.", sentiment: "positive", sentiment_reason: "Strong praise for taste balance", sentiment_keywords: ["cheese", "balanced", "memorable"], language: "en", approved: true },
  { rating: 4, feedback: "Cozy atmosphere with authentic Italian flavors.", sentiment: "positive", sentiment_reason: "Positive atmosphere and authenticity", sentiment_keywords: ["cozy", "authentic", "italian"], language: "en", approved: true },
  { rating: 2, feedback: "Delivery exceeded one hour and food was not hot.", sentiment: "negative", sentiment_reason: "Negative delivery speed and temperature", sentiment_keywords: ["delivery", "hour", "hot"], language: "en", approved: true },
  { rating: 4, feedback: "Friendly team and reliable lunch specials.", sentiment: "positive", sentiment_reason: "Positive consistency and service", sentiment_keywords: ["friendly", "reliable", "lunch"], language: "en", approved: true },
  { rating: 3, feedback: "Menu is fine, but needs more vegetarian options.", sentiment: "neutral", sentiment_reason: "Neutral with menu variety suggestion", sentiment_keywords: ["menu", "vegetarian", "options"], language: "en", approved: true },
  { rating: 5, feedback: "Celebration dinner was perfect and staff went above expectations.", sentiment: "positive", sentiment_reason: "Very positive special-occasion experience", sentiment_keywords: ["perfect", "staff", "celebration"], language: "en", approved: true },
];

export const SAMPLE_REVIEW_ROWS: SampleReview[] = SAMPLE_FEEDBACK.map((item, index) => ({
  ...item,
  name: `Sample Customer ${index + 1}`,
  email: `sample.customer.${index + 1}@example.com`,
}));
