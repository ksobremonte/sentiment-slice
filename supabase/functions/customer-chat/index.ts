// Edge function for customer chat with real review data

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
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

CRITICAL GUIDELINES:
- NEVER invent or fabricate customer reviews - only use the real reviews provided above
- When quoting reviews, use the exact feedback text from the data
- If no reviews match a query, honestly say you don't have specific reviews about that topic
- For orders or reservations, direct them to call ${storeInfo.phone}
- If you don't know something specific, be honest and suggest they contact the store directly
- Be enthusiastic about the food and share genuine customer praise!`;

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
