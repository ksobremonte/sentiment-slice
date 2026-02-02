import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeInfo } = await req.json() as { messages: Message[]; storeInfo: StoreInfo };

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages array is required");
    }

    const systemPrompt = `You are a friendly and helpful customer service assistant for ${storeInfo.name}, a popular Italian pizzeria located in ${storeInfo.location}.

STORE INFORMATION:
- Name: ${storeInfo.name}
- Location: ${storeInfo.location}
- Hours: Weekdays ${storeInfo.hours.weekdays}, Weekends ${storeInfo.hours.weekends}
- Phone: ${storeInfo.phone}
- Delivery: ${storeInfo.delivery}

DAILY SPECIALS (Example - these rotate):
- Monday: Buy 1 Get 1 on all medium pizzas
- Tuesday: 20% off pasta dishes
- Wednesday: Family meal deal - 2 large pizzas + drinks for ₱999
- Thursday: Free garlic bread with any large pizza
- Friday-Sunday: Weekend special combos available

UPCOMING EVENTS:
- Every Saturday: Live acoustic music from 7-9 PM
- Monthly pizza-making workshops for kids

YOUR ROLE:
1. Answer questions about store hours, location, and contact info
2. Share information about daily specials and promotions
3. Provide details about upcoming events
4. Help with general inquiries about the menu
5. Be warm, friendly, and use occasional Italian phrases like "Buongiorno!" or "Grazie!"

GUIDELINES:
- Keep responses concise but helpful
- If asked about specific menu items or prices, suggest they check the menu page or call the store
- For orders or reservations, direct them to call ${storeInfo.phone}
- Be enthusiastic about the food!
- If you don't know something specific, be honest and suggest they contact the store directly`;

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
    ];

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
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
