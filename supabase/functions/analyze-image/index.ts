import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an image classifier for a pizza restaurant review system. Analyze the provided image and determine if it is relevant to a restaurant context. Relevant images include: food, drinks, restaurant interior/exterior, menus, receipts, dining experiences, pizza, kitchen, staff serving food, table settings, etc. Irrelevant images include: random selfies unrelated to dining, memes, screenshots of unrelated content, inappropriate content, landscapes with no restaurant context, etc.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl }
              },
              {
                type: "text",
                text: "Is this image relevant to a restaurant review? Classify it."
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_image",
              description: "Classify whether an image is relevant to a restaurant review",
              parameters: {
                type: "object",
                properties: {
                  relevant: {
                    type: "boolean",
                    description: "Whether the image is relevant to a restaurant context"
                  },
                  category: {
                    type: "string",
                    enum: ["food", "drink", "interior", "exterior", "receipt", "menu", "dining_experience", "staff", "other_relevant", "irrelevant"],
                    description: "Category of the image"
                  },
                  reason: {
                    type: "string",
                    description: "Brief reason for the classification (max 50 words)"
                  }
                },
                required: ["relevant", "category", "reason"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "classify_image" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        // Fallback: allow image by default when AI is unavailable
        console.warn("AI unavailable (status " + response.status + "), allowing image by default");
        return new Response(
          JSON.stringify({ relevant: true, category: "other_relevant", reason: "AI analysis unavailable, image allowed by default" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Failed to analyze image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ relevant: true, category: "other_relevant", reason: "Could not classify, allowing by default" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-image:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
