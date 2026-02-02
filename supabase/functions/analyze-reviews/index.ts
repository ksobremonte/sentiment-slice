// Edge function for analyzing reviews with AI

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { reviews, action, messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (action === "sort") {
      // Sort reviews by relevance using AI
      const systemPrompt = `You are a review analyzer for a pizza restaurant. Analyze the following reviews and sort them by relevance/importance.
      
Consider these factors for relevance:
1. Actionable feedback (specific suggestions, complaints about specific items)
2. Detailed descriptions of experience
3. Recent reviews
4. Reviews with strong sentiment (very positive or negative)
5. Reviews mentioning specific menu items or staff

Return a JSON array of review IDs in order from most relevant to least relevant.
Only return the JSON array, no other text. Format: ["id1", "id2", "id3", ...]`;

      const reviewSummary = (reviews as Review[]).map(r => ({
        id: r.id,
        rating: r.rating,
        feedback: r.feedback,
        sentiment: r.sentiment,
        created_at: r.created_at
      }));

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(reviewSummary) }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      
      // Parse the sorted IDs
      let sortedIds: string[];
      try {
        sortedIds = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
      } catch {
        // If parsing fails, return original order
        sortedIds = (reviews as Review[]).map(r => r.id);
      }

      return new Response(JSON.stringify({ sortedIds }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze-sentiment") {
      // Analyze sentiment and detect language of a single review
      const review = reviews[0] as Review;
      const systemPrompt = `You are an analyzer for a pizza restaurant. Analyze the following customer review and determine:
1. The sentiment: positive, negative, or neutral
2. The language of the feedback text (use ISO 639-1 code, e.g., "en" for English, "es" for Spanish, "fr" for French)

Consider for sentiment:
1. The star rating (1-5 stars)
2. The tone and words used in the feedback
3. Whether the customer seems satisfied or dissatisfied

A 4-5 star review with positive/neutral language = positive
A 1-2 star review with negative language = negative
A 3 star review or mixed feedback = neutral

Return ONLY a JSON object with two fields: {"sentiment": "positive|negative|neutral", "language": "en|es|fr|etc"}`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Rating: ${review.rating}/5 stars\nFeedback: "${review.feedback}"` }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      
      // Parse the JSON response
      let sentiment = "neutral";
      let language = "en";
      let approved = true;
      
      try {
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        if (parsed.sentiment) {
          if (parsed.sentiment.includes("positive")) sentiment = "positive";
          else if (parsed.sentiment.includes("negative")) sentiment = "negative";
          else sentiment = "neutral";
        }
        if (parsed.language) {
          language = parsed.language.toLowerCase().substring(0, 5);
          // Auto-reject non-English reviews for moderation
          approved = language === "en";
        }
      } catch {
        // Fallback: try to extract sentiment from raw text
        const lower = content.toLowerCase();
        if (lower.includes("positive")) sentiment = "positive";
        else if (lower.includes("negative")) sentiment = "negative";
      }

      return new Response(JSON.stringify({ sentiment, language, approved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chat") {
      // Chat interface for analyzing reviews
      const systemPrompt = `You are an AI assistant for a pizza restaurant dashboard. You help analyze customer reviews and provide insights.

Current reviews data:
${JSON.stringify(reviews, null, 2)}

You can:
- Summarize overall sentiment
- Identify common themes or complaints
- Highlight actionable feedback
- Calculate statistics (avg rating, sentiment distribution)
- Suggest improvements based on feedback
- Answer questions about specific reviews

Be concise and helpful. Use the actual data provided.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
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
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-reviews:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
