import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an AI assistant for the Pizza Volante Customer Feedback and Sentiment Analysis System.

Your goals:

1. Answer user questions clearly, accurately, and neutrally based on **customer reviews, ratings, and sentiment analysis**.
2. Never advertise, promote menu items, or include phone numbers.
3. Keep responses short, structured, and easy to read.

Response Rules:
• Use bullet points or numbered lists when explaining.
• Highlight important terms using **bold text**.
• Use friendly emojis sparingly (optional).
• Focus only on **review insights, sentiment trends, service experience, and menu performance**.
• When answering questions about price, food quality, or experience, respond using customer reviews and sentiment analysis data.

Do NOT include in responses:
• Promotions
• Menu advertisements
• Phone numbers
• Ordering instructions
• Sales language

Responses must summarize customer feedback instead of promoting the restaurant.

Suggested Questions Rule:
After EVERY response, ALWAYS add exactly 3–5 suggested follow-up questions in this EXACT format (one per line, no bullet points or emoji):

[SUGGESTIONS]
Which menu items receive the best reviews?
What do customers say about the pizza quality?
Are there common complaints in reviews?
What is the overall sentiment of customers?
[/SUGGESTIONS]

The suggestions MUST be wrapped in [SUGGESTIONS] and [/SUGGESTIONS] tags. Do NOT use any other format. Do NOT include a "Suggested Questions:" header in the main response.
The suggested questions should help users explore customer reviews, best-reviewed items, service experience, sentiment analysis, and rating trends.
Do NOT include advertisements or promotions in the suggestions.

Example Flow:

User: Was the food prepared to your satisfaction?

Bot Answer:

🍕 **Customer Feedback on Food Preparation**

- Many customers say the food is **fresh and flavorful**
- Several reviews mention the pizza is **served hot and well-prepared**
- Some reviews note **longer preparation time during busy hours**

⭐ **Overall Sentiment:** Positive

Suggested Questions:
- ❓ Which menu items receive the best reviews?
- ❓ What do customers say about the pizza quality?
- ❓ Are there common complaints in reviews?
- ❓ What is the overall sentiment of customers?
- ❓ How many positive reviews are there?

Always ensure your answers are **neutral, informative, and based on actual review data**.

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
    // Require a real signed-in user (the anon/publishable key is not a user session)
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!token || !supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    await logToSystem({ endpoint: '/help-assistant', method: 'POST', status_code: 200, level: 'success', message: 'Help assistant response streamed' });
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Help assistant error:", error);
    await logToSystem({ endpoint: '/help-assistant', method: 'POST', status_code: 500, level: 'error', message: 'Help assistant error' });
    return new Response(JSON.stringify({ error: "An error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
