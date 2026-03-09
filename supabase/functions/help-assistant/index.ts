const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI assistant for the Pizza Volante Customer Feedback and Sentiment Analysis System.

Goals:
1. Answer user questions clearly and neutrally, based ONLY on customer reviews, ratings, and sentiment analysis.
2. Do NOT advertise, promote menu items, include phone numbers, or upsell.
3. After answering the question, automatically provide 3–5 suggested follow-up questions related to menu items, best-sellers, review insights, and sentiment trends.

Response Rules:
• Keep answers short and easy to read.
• Use bullet points or numbered steps if explaining.
• Highlight important terms using **bold text**.
• Use emojis sparingly if needed.

Suggested Questions Rules:
• Questions should focus on menu items, customer favorites, review trends, and sentiment analysis.
• Examples of suggested questions:
  - ❓ Which menu items get the best reviews?
  - ❓ What are our top-selling dishes?
  - ❓ What do customers say about our pizza?
  - ❓ How do ratings vary across different dishes?
  - ❓ What is the overall sentiment for our pasta dishes?
• Do NOT suggest ordering, promos, or sales.

Example Flow:

User: Was the food prepared to your satisfaction?

Bot Answer:

🍕 **Customer Feedback on Food Preparation**

- Many customers say the food is **fresh and flavorful**
- Several reviews mention the pizza is **served hot and well-prepared**
- Some reviews note **longer preparation time during busy hours**

⭐ **Overall Sentiment:** Positive

💡 Suggested Follow-Up Questions:

- ❓ Which menu items get the best reviews?
- ❓ What are our top-selling dishes?
- ❓ What do customers say about our pizza?
- ❓ How do ratings vary across different dishes?
- ❓ What is the overall sentiment for our pasta dishes?

If the question is not related to the system, say:
"I can only answer questions related to the Pizza Volante Review System."

KNOWN SYSTEM FEATURES:
- Dashboard pages: Overview, Reviews, Chats/Conversations, Sentiment Analysis, Trends, Alerts, AI Chat, Notifications, Audit Log, User Management, Settings, Help Center
- Reviews can be analyzed for sentiment (positive/neutral/negative) using AI
- Admin can respond to reviews
- Reviews can be approved or hidden
- Sentiment keywords and reasoning are shown for each analyzed review
- Customer chat widget allows real-time conversations
- Alert system monitors negative review spikes
- Trends page shows sentiment over time
- Settings include profile, appearance (theme, font size, language), and security (password change)
- Notifications show new reviews and require-attention items
- Audit log tracks all admin actions on reviews`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Service configuration error." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 30) {
      return new Response(JSON.stringify({ error: "Too many messages (max 30)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const msg of messages) {
      if (msg.content && typeof msg.content === "string" && msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Message too long (max 5000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Help assistant error:", error);
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
