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
      // Advanced NLP-based sentiment analysis with multi-aspect evaluation
      const review = reviews[0] as Review;
      
      const systemPrompt = `You are an advanced sentiment analysis system for a pizza restaurant. Perform deep NLP analysis on customer reviews.

ANALYSIS FRAMEWORK:
1. **Lexical Analysis**: Identify sentiment-bearing words, intensifiers (very, extremely), negations (not, never), and hedging language (somewhat, kind of)
2. **Contextual Understanding**: Consider sarcasm, irony, and implicit sentiment (e.g., "interesting pizza" could be negative)
3. **Aspect-Based Sentiment**: Evaluate sentiment for different aspects:
   - Food quality (taste, freshness, portion size)
   - Service (staff attitude, speed, accuracy)
   - Value (price vs quality)
   - Ambiance/experience
4. **Rating-Text Alignment**: Check if the star rating aligns with the text sentiment (misalignment may indicate nuanced feelings)
5. **Emotional Intensity**: Measure how strongly positive or negative the sentiment is

CLASSIFICATION RULES:
- POSITIVE: Predominantly positive language, satisfaction indicators, recommendation intent, 4-5 stars with matching text
- NEGATIVE: Complaints, disappointment, frustration, warnings to others, 1-2 stars with matching text  
- NEUTRAL: Mixed feelings, balanced pros/cons, lukewarm praise, 3 stars, or rating-text mismatch requiring moderation

EDGE CASES:
- Sarcasm with low rating = negative (even if words seem positive)
- Constructive criticism with high rating = positive (customer is satisfied but helpful)
- Single word reviews: rely more on rating
- Emoji-heavy reviews: interpret emoji sentiment`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this review:\n\nRating: ${review.rating}/5 stars\nFeedback: "${review.feedback}"\n\nProvide your analysis.` }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_sentiment",
                description: "Classify the sentiment of a customer review with detailed analysis",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment: {
                      type: "string",
                      enum: ["positive", "negative", "neutral"],
                      description: "The overall sentiment classification"
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score from 0.0 to 1.0"
                    },
                    language: {
                      type: "string",
                      description: "ISO 639-1 language code (e.g., en, es, fr, it, de)"
                    },
                    aspects: {
                      type: "object",
                      properties: {
                        food: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        service: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        value: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        experience: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] }
                      },
                      description: "Sentiment for each aspect of the review"
                    },
                    key_phrases: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key sentiment-bearing phrases from the review (max 3)"
                    },
                    rating_alignment: {
                      type: "boolean",
                      description: "Whether the text sentiment aligns with the star rating"
                    }
                  },
                  required: ["sentiment", "confidence", "language", "aspects", "rating_alignment"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "classify_sentiment" } }
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
      
      // Extract structured output from tool call
      let sentiment = "neutral";
      let language = "en";
      let approved = true;
      let confidence = 0.5;
      let aspects = {};
      let keyPhrases: string[] = [];
      let ratingAlignment = true;
      
      try {
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          
          sentiment = parsed.sentiment || "neutral";
          confidence = parsed.confidence || 0.5;
          language = (parsed.language || "en").toLowerCase().substring(0, 5);
          aspects = parsed.aspects || {};
          keyPhrases = parsed.key_phrases || [];
          ratingAlignment = parsed.rating_alignment ?? true;
          
          // Auto-reject non-English reviews for moderation
          approved = language === "en";
          
          // If rating doesn't align with text AND confidence is low, mark for moderation
          if (!ratingAlignment && confidence < 0.7) {
            approved = false;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse tool call response:", parseError);
        // Fallback: use simple heuristics based on rating
        if (review.rating >= 4) sentiment = "positive";
        else if (review.rating <= 2) sentiment = "negative";
        else sentiment = "neutral";
      }

      return new Response(JSON.stringify({ 
        sentiment, 
        language, 
        approved,
        confidence,
        aspects,
        keyPhrases,
        ratingAlignment
      }), {
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
