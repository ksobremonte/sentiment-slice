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
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error. Please try again later." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    if (!Array.isArray(reviews)) {
      return new Response(JSON.stringify({ error: "Invalid reviews format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (reviews.length > 100) {
      return new Response(JSON.stringify({ error: "Too many reviews (max 100)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const review of reviews) {
      if (review.feedback && typeof review.feedback === "string" && review.feedback.length > 5000) {
        return new Response(JSON.stringify({ error: "Review feedback too long (max 5000 chars)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const validActions = ["sort", "analyze-sentiment", "chat"];
    if (!action || !validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "chat") {
      if (!Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "Invalid messages format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (messages.length > 50) {
        return new Response(JSON.stringify({ error: "Too many messages (max 50)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      for (const msg of messages) {
        if (msg.content && typeof msg.content === "string" && msg.content.length > 10000) {
          return new Response(JSON.stringify({ error: "Message too long (max 10000 chars)" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
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
      // Pure text-based NLP sentiment analysis - no star rating influence
      const review = reviews[0] as Review;
      
      const systemPrompt = `You are a sentiment analysis assistant for a pizza restaurant dashboard.

Rules:
- Do NOT write paragraphs.
- Do NOT exceed 3 bullet points for main points.
- Reason must be ONE sentence only.
- Focus only on what affects sentiment.
- Ignore unnecessary details.

LANGUAGE SUPPORT: Reviews may be in English, Filipino (Tagalog), Ilocano, Cebuano (Bisaya), Pangasinan, Kapampangan, Bicolano, Waray, or other Philippine languages.

Key vocabulary:
- Ilocano positive: nalaing, nasayaat, napintas, nagpaspas, naimas
- Ilocano negative: madi, saan a nasayaat, narigat, bassit
- Cebuano/Bisaya positive: lami, nindot, maayo, ganahan, sarap
- Cebuano/Bisaya negative: dili maayo, lain, wala, dili ganahan, way lami
- Tagalog positive: masarap, maganda, magaling, mahusay, masaya
- Tagalog negative: hindi masarap, pangit, masamâ, walang kwenta

IMPORTANT: You MUST first translate any non-English review to English to fully understand the meaning, then classify the sentiment based on the translated meaning. Include the English translation in your reasoning so the admin understands what the review says.

CLASSIFICATION (text only, ignore star ratings):
- POSITIVE: praise, satisfaction, enthusiasm, recommendations
- NEGATIVE: complaints, disappointment, frustration, criticism
- NEUTRAL: factual descriptions, ambiguous, no clear emotion

MIXED SENTIMENT RULES:
1. Identify the Strongest Emotion: Base your primary sentiment on the most dominant feeling in the comment.
2. Handle Conflict: If the comment contains both positive and negative elements, you must list both (e.g., "positive, negative" or "positive, neutral").
3. Decisiveness: If one sentiment is clearly stronger, pick that one only. If it is a clear split, use two separated by comma.
4. Output: Provide only the label(s) in the sentiment field.

Detect sarcasm and emoji sentiment. Base result on meaning, not unknown words.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: `Analyze this review text (ignore any rating):\n\n"${review.feedback}"\n\nProvide: sentiment classification, one-sentence reason, and up to 3 key phrases.` }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_sentiment",
                description: "Classify the sentiment of a customer review based purely on text analysis",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment: {
                      type: "string",
                      description: "The overall sentiment. Use one label if one emotion dominates (e.g. 'positive'), or comma-separated if clearly mixed (e.g. 'positive, negative'). Allowed values: positive, negative, neutral, or combinations."
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
                      description: "Sentiment for each aspect mentioned in the review text"
                    },
                    key_phrases: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key sentiment-bearing phrases from the review (max 3)"
                    },
                    reasoning: {
                      type: "string",
                      description: "ONE sentence only explaining why this sentiment was chosen"
                    }
                  },
                  required: ["sentiment", "confidence", "language", "aspects", "reasoning"]
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
      let reasoning = "";
      
      try {
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          
          sentiment = parsed.sentiment || "neutral";
          confidence = parsed.confidence || 0.5;
          language = (parsed.language || "en").toLowerCase().substring(0, 5);
          aspects = parsed.aspects || {};
          keyPhrases = parsed.key_phrases || [];
          reasoning = parsed.reasoning || "";
          
          // All reviews are auto-approved immediately
          approved = true;
        }
      } catch (parseError) {
        console.error("Failed to parse tool call response:", parseError);
        sentiment = "neutral";
        approved = true;
      }

      return new Response(JSON.stringify({ 
        sentiment, 
        language, 
        approved,
        confidence,
        aspects,
        keyPhrases,
        reasoning
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
    return new Response(JSON.stringify({ error: "An error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
