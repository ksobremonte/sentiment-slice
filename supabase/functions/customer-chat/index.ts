// Edge function for customer chat with real review data and feedback detection

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface StoreInfo {
  name: string;
  location: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
  phone: string;
  delivery: string;
}

interface Review {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  created_at: string;
}

interface FeedbackClassification {
  is_feedback: boolean;
  category: "complaint" | "concern" | "question" | "praise" | "none";
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
}

// Function to classify if a message is feedback/complaint
async function classifyFeedback(message: string, lovableApiKey: string): Promise<FeedbackClassification> {
  const classificationPrompt = `You are a feedback classifier for a pizza restaurant. Analyze the customer message and determine if it contains genuine feedback about:
- Food quality, taste, or preparation
- Service quality or staff behavior
- Cleanliness or hygiene
- Delivery issues
- Pricing concerns
- Any complaints, concerns, or negative experiences

IMPORTANT: Only classify as feedback if the message is a SINCERE complaint, concern, question, or comment about the restaurant experience. Do NOT classify general greetings, questions about hours/menu, or casual conversation as feedback.

Respond with a JSON object:
{
  "is_feedback": boolean (true if message contains genuine restaurant feedback),
  "category": "complaint" | "concern" | "question" | "praise" | "none",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": number (0-1, how confident you are this is genuine feedback),
  "summary": string (brief summary of the feedback, max 100 chars)
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: classificationPrompt },
          { role: "user", content: `Classify this customer message: "${message}"` }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("Classification API error:", await response.text());
      return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "" };
  } catch (error) {
    console.error("Error classifying feedback:", error);
    return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "" };
  }
}

// Function to save feedback as a review
async function saveFeedbackAsReview(
  supabase: ReturnType<typeof createClient>,
  feedback: string,
  classification: FeedbackClassification
): Promise<void> {
  try {
    // Insert the review with chat-specific defaults
    const { error } = await supabase.from("reviews").insert({
      name: "Chat Visitor",
      email: "chat-feedback@pizzavolante.local",
      rating: 3, // Neutral rating - sentiment is determined from text
      feedback: feedback,
      sentiment: classification.sentiment,
      approved: false, // Always require admin moderation for chat feedback
      language: "en",
    });

    if (error) {
      console.error("Error saving chat feedback:", error);
    } else {
      console.log("Chat feedback saved for moderation:", classification.summary);
    }
  } catch (error) {
    console.error("Error in saveFeedbackAsReview:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeInfo } = await req.json() as { messages: Message[]; storeInfo: StoreInfo };

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    // Initialize Supabase client to fetch real reviews
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the latest user message for feedback classification
    const latestUserMessage = messages.filter(m => m.role === "user").pop();
    
    // Classify if the message contains feedback (run in background, don't block response)
    if (latestUserMessage && latestUserMessage.content.length > 10) {
      classifyFeedback(latestUserMessage.content, lovableApiKey).then(async (classification) => {
        if (classification.is_feedback && classification.confidence >= 0.7) {
          console.log("Detected feedback:", classification);
          await saveFeedbackAsReview(supabase, latestUserMessage.content, classification);
        }
      }).catch(err => console.error("Background feedback classification error:", err));
    }

    // Fetch approved reviews from the database (prioritizing 4-5 star reviews)
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews_public")
      .select("id, name, rating, feedback, sentiment, created_at")
      .eq("approved", true)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    }

    // Separate high-rated reviews for highlighting
    const highRatedReviews = (reviews || []).filter((r: Review) => r.rating >= 4);
    const otherReviews = (reviews || []).filter((r: Review) => r.rating < 4);

    // Format reviews for the AI context
    const formatReviews = (reviewList: Review[]) => {
      if (!reviewList || reviewList.length === 0) return "No reviews available.";
      return reviewList.map((r: Review) => 
        `- ${r.name} (${r.rating}★): "${r.feedback}" [${new Date(r.created_at).toLocaleDateString()}]`
      ).join("\n");
    };

    // Calculate review statistics
    const totalReviews = (reviews || []).length;
    const avgRating = totalReviews > 0 
      ? ((reviews || []).reduce((sum: number, r: Review) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "N/A";
    const fiveStarCount = (reviews || []).filter((r: Review) => r.rating === 5).length;
    const fourStarCount = (reviews || []).filter((r: Review) => r.rating === 4).length;

    const systemPrompt = `You are a friendly and helpful customer service assistant for ${storeInfo.name}, a popular Italian pizzeria located in ${storeInfo.location}.

STORE INFORMATION:
- Name: ${storeInfo.name}
- Location: ${storeInfo.location}
- Hours: Weekdays ${storeInfo.hours.weekdays}, Weekends ${storeInfo.hours.weekends}
- Phone: ${storeInfo.phone}
- Delivery: ${storeInfo.delivery}

DAILY SPECIALS (These rotate):
- Monday: Buy 1 Get 1 on all medium pizzas
- Tuesday: 20% off pasta dishes
- Wednesday: Family meal deal - 2 large pizzas + drinks for ₱999
- Thursday: Free garlic bread with any large pizza
- Friday-Sunday: Weekend special combos available

UPCOMING EVENTS:
- Every Saturday: Live acoustic music from 7-9 PM
- Monthly pizza-making workshops for kids

CUSTOMER REVIEW STATISTICS:
- Total Reviews: ${totalReviews}
- Average Rating: ${avgRating}★
- 5-Star Reviews: ${fiveStarCount}
- 4-Star Reviews: ${fourStarCount}

HIGHLIGHTED CUSTOMER REVIEWS (4-5 Stars):
${formatReviews(highRatedReviews)}

${otherReviews.length > 0 ? `OTHER CUSTOMER REVIEWS:\n${formatReviews(otherReviews)}` : ""}

YOUR ROLE:
1. Answer questions about store hours, location, and contact info
2. Share information about daily specials and promotions
3. Provide details about upcoming events
4. When asked about reviews or customer experiences, ONLY reference the REAL reviews provided above
5. Highlight positive 4-5 star reviews when discussing customer satisfaction
6. Summarize review themes when asked about what customers think
7. Be warm, friendly, and use occasional Italian phrases like "Buongiorno!" or "Grazie!"
8. If a customer expresses a complaint or concern, acknowledge it empathetically and assure them their feedback has been noted

CRITICAL GUIDELINES:
- NEVER invent or fabricate customer reviews - only use the real reviews provided above
- When quoting reviews, use the exact feedback text from the data
- If no reviews match a query, honestly say you don't have specific reviews about that topic
- For orders or reservations, direct them to call ${storeInfo.phone}
- If you don't know something specific, be honest and suggest they contact the store directly
- Be enthusiastic about the food and share genuine customer praise!
- When customers share complaints or concerns, respond with empathy and let them know their feedback is being forwarded to management`;

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to get response from AI");
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
