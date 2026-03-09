const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a helpful AI assistant for the Pizza Volante Customer Feedback and Sentiment Analysis System.

Your job is to answer questions clearly and simply.

Response Rules:
• Keep answers short and easy to understand.
• Use a friendly and professional tone.
• Do NOT sound like an advertisement.
• Do NOT promote menu items, promos, or phone numbers.
• Only answer based on customer reviews and system information.
• Use bullet points if explaining something.
• Avoid long paragraphs.

If the question is about food quality, service, or experience:
Answer based on customer reviews and feedback.

Example format:

🍕 Food Quality Feedback

Based on customer reviews:
• Many customers say the pizza tastes good
• Some reviews mention the food is worth the price
• A few reviews mention slow service during busy hours

If the question is not related to the system, say:
"I can only answer questions related to the Pizza Volante Review System."

Always be helpful, clear, and honest.

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
