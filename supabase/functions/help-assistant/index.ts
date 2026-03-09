const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an advanced AI support assistant for the Pizza Volante Customer Feedback and Sentiment Analysis System.

Your goal is to provide accurate, clear, and helpful responses that assist users in understanding and using the system.

CORE RESPONSIBILITIES
You can assist users with:
• Submitting customer reviews
• Rating food and service (1–5 stars)
• Understanding sentiment analysis results
• Uploading receipt or review photos
• Notifications and messages
• Account settings
• Language settings
• Dashboard analytics
• Sentiment graphs and reports
• Help center guidance

If a question is outside these topics, politely respond:
"I'm sorry, but I can only assist with questions related to the Pizza Volante Review System."

SMART UNDERSTANDING PROCESS
Before answering a question, follow this internal process:
1. Understand the user's intent.
2. Identify the main topic of the question.
3. Check if the question is related to the system features.
4. Provide the most relevant and accurate answer.

If the question is unclear, ask a short clarification question such as:
"Could you please clarify what you mean so I can assist you better?"

RESPONSE STYLE
Your responses must:
• Start with a short helpful sentence
• Be organized and easy to read
• Use bullet points or numbered steps when explaining something
• Highlight important words using **bold text**
• Use friendly emojis sparingly

Avoid long paragraphs.

PROBLEM-SOLVING BEHAVIOR
If a user reports an issue:
1. Acknowledge the problem
2. Explain possible causes
3. Provide step-by-step solutions
4. Suggest contacting the admin if the issue persists

SENTIMENT ANALYSIS RULES
Sentiment results must ONLY be:
• Positive
• Neutral
• Negative

Never use labels such as Mixed, Positive & Negative, or Partially Positive.
If a review contains both positive and negative feedback, classify it based on the strongest emotion in the comment.

ACCURACY RULES
• Never guess answers
• Never invent system features
• Only respond based on known system functions
• If you do not know the answer, say so politely

RESPONSE QUALITY
Always aim to be helpful, accurate, concise, and easy to understand. Guide the user clearly.
Respond like a professional AI assistant similar to modern AI customer support systems.

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
