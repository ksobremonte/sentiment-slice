// Edge function for analyzing reviews with AI
import { logToSystem } from '../_shared/systemLog.ts'

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

type SentimentLabel = "positive" | "negative" | "neutral";

const POSITIVE_KEYWORDS = [
  "good", "great", "excellent", "amazing", "awesome", "love", "loved", "perfect", "fresh", "crispy",
  "delicious", "tasty", "friendly", "fast", "clean", "recommend", "best", "masarap", "sarap", "ang sarap",
  "nalaing", "nasayaat", "nagsayaat", "napintas", "nagpaspas", "naimas", "nagimas", "nimas", "naragsak",
  "nakaskasdaaw", "naimbag", "nasantuan", "nagdakkel", "nalaka", "lami", "nindot", "ganahan",
];

const NEGATIVE_KEYWORDS = [
  "bad", "worse", "worst", "awful", "terrible", "bland", "cold", "slow", "late", "burnt", "salty",
  "oily", "expensive", "overpriced", "rude", "dirty", "disappoint", "madi", "saan a nasayaat", "narigat",
  "bassit", "tamnay", "nakaro", "nakabuteng", "naalas", "nadawel", "walang lasa", "hindi masarap",
  "tab-ang", "delay", "hilaw",
];

const POSITIVE_EMOJIS = ["😊", "😁", "😍", "🥰", "😋", "🤤", "👍", "👌", "🔥", "❤️", "💯", "🎉", "🥳", "⭐", "🌟", "✨", "😎", "🙌", "💪", "🤩", "💖", "👏"];
const NEGATIVE_EMOJIS = ["😡", "😤", "🤮", "🤢", "👎", "😠", "😒", "😞", "😢", "😭", "💔", "🚫", "❌", "😩", "😫", "🙄", "😣", "😖", "🤬", "⚠️", "💀", "☠️", "😰", "😨", "😱"];
const NEUTRAL_EMOJIS = ["😐", "🤔", "😶", "🫤", "🤷", "📝", "📌", "ℹ️", "🔔", "📢", "🙂", "😏", "🫡"];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "have", "very", "pero", "kasi", "lang", "yung", "ang", "mga",
  "nga", "naman", "din", "sila", "kami", "siya", "your", "you", "are", "was", "were", "been", "really", "just", "order",
  "pizza", "food", "store", "place", "restaurant",
]);

const sortFallbackByRatingThenDate = (reviewList: Review[]) => {
  return [...reviewList]
    .sort((a, b) => {
      const ratingDiff = b.rating - a.rating;
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .map((review) => review.id);
};

const countEmojiHits = (text: string, emojis: string[]) =>
  emojis.reduce((acc, emoji) => acc + (text.includes(emoji) ? 1 : 0), 0);

const extractKeyPhrases = (feedback: string) => {
  const words = feedback
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
};

const detectLanguage = (feedback: string) => {
  const text = feedback.toLowerCase();
  if (["nalaing", "nasayaat", "nagsayaat", "napintas", "nagpaspas", "naimas", "nagimas", "nimas", "naragsak", "nakaskasdaaw", "naimbag", "nasantuan", "diyay", "daytoy", "madi", "narigat", "bassit", "tamnay", "nakaro", "naalas", "nadawel"].some((word) => text.includes(word))) return "ilo";
  if (["masarap", "hindi", "walang", "sarap", "sobrang", "pangit"].some((word) => text.includes(word))) return "tl";
  if (["lami", "nindot", "dili", "ganahan", "tab-ang"].some((word) => text.includes(word))) return "ceb";
  return "en";
};

const getFallbackSentiment = (review: Review) => {
  const feedback = review.feedback ?? "";
  const text = feedback.toLowerCase();

  const keywordPositive = POSITIVE_KEYWORDS.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
  const keywordNegative = NEGATIVE_KEYWORDS.reduce((acc, word) => acc + (text.includes(word) ? 1 : 0), 0);
  const emojiPositive = countEmojiHits(feedback, POSITIVE_EMOJIS);
  const emojiNegative = countEmojiHits(feedback, NEGATIVE_EMOJIS);
  const emojiNeutral = countEmojiHits(feedback, NEUTRAL_EMOJIS);

  const positiveScore = keywordPositive + emojiPositive;
  const negativeScore = keywordNegative + emojiNegative;

  let sentiment: SentimentLabel = "neutral";
  if (positiveScore > negativeScore) sentiment = "positive";
  else if (negativeScore > positiveScore) sentiment = "negative";
  else if (positiveScore === 0 && negativeScore === 0 && emojiNeutral > 0) sentiment = "neutral";

  const totalSignals = positiveScore + negativeScore + emojiNeutral;
  const confidence = totalSignals > 0
    ? Number((Math.max(positiveScore, negativeScore, emojiNeutral) / totalSignals).toFixed(2))
    : 0.55;

  const keyPhrases = extractKeyPhrases(feedback);
  const language = detectLanguage(feedback);

  const reasoning = sentiment === "positive"
    ? "Detected mainly positive words/emojis in the review text."
    : sentiment === "negative"
      ? "Detected mainly negative words/emojis in the review text."
      : "The review text appears balanced or lacks strong sentiment signals.";

  return {
    sentiment,
    language,
    approved: (review.rating >= 4),
    confidence,
    aspects: {},
    keyPhrases,
    reasoning,
    fallback: true,
  };
};

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
          return new Response(JSON.stringify({
            sortedIds: sortFallbackByRatingThenDate(reviews as Review[]),
            fallback: true,
            warning: "AI rate limit reached. Sorted by rating/date fallback.",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({
            sortedIds: sortFallbackByRatingThenDate(reviews as Review[]),
            fallback: true,
            warning: "AI credits exhausted. Sorted by rating/date fallback.",
          }), {
            status: 200,
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

      await logToSystem({ endpoint: '/analyze-reviews', method: 'POST', status_code: 200, level: 'success', message: `AI sort completed for ${reviews.length} reviews` });
      return new Response(JSON.stringify({ sortedIds }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze-sentiment") {
      // Pure text-based NLP sentiment analysis - no star rating influence
      const review = reviews[0] as Review;
      
      const systemPrompt = `You are a highly accurate multilingual review analyzer for a restaurant website (Pizza Volante).

You MUST correctly analyze reviews written in: English, Tagalog (Filipino), Ilokano, Cebuano/Bisaya, and mixed languages (Taglish, Iloklish).

STEP 1: LANGUAGE DETECTION
Detect ALL languages used in the review (not just one).
Examples: "ilo+tl" for Ilokano + Tagalog, "tl+en" for Tagalog + English, "en" for pure English.

STEP 2: NORMALIZATION & TRANSLATION
Convert the review into clear English. Understand meaning, not just direct translation.
Handle slang, misspellings, and informal words:
- "awan kwenta" → "useless"
- "ang tagal" → "too slow"
- "di masarap" → "not tasty"
- "tamnay" → "bland / lacks flavor"
- "madi" → "bad / not good"
- "nalaing" / "naimas" → "delicious"
- "nasayaat" → "good"
- "lami" / "nindot" → "delicious" / "nice" (Cebuano)

STEP 3: SENTIMENT ANALYSIS (STRICT)
Classify sentiment:
- Positive → praise, satisfaction, enthusiasm, recommendations
- Negative → complaints, dissatisfaction, frustration, criticism
- Neutral → unclear or mixed without strong emotion
CRITICAL RULE: If ANY strong negative phrase exists → sentiment = Negative. Do NOT mark Positive if there is any complaint.

STEP 4: CONCERN DETECTION (VERY IMPORTANT)
Set has_concern = true if the review includes: complaints, delays, bad service, wrong orders, missing items, questions, or requests.
Even if not obvious, infer concern from context.

STEP 5: ISSUE EXTRACTION
Extract the main issue in 2-5 words only. Examples: "Slow service", "Rude staff", "Wrong order", "Food not tasty". Leave empty if no issue.

STEP 6: RESPONSE GENERATION
Generate a short, human-like reply:
- Positive → friendly thank you
- Negative → apologize + acknowledge the issue
- Concern → apologize + ask for details OR offer help
Tone: Polite, natural, not robotic.

EMOJI SENTIMENT MAPPING:
- POSITIVE: 😊 😁 😍 🥰 😋 🤤 👍 👌 🔥 ❤️ 💯 🎉 🥳 ⭐ 🌟 ✨ 😎 🙌 💪 🤩 💖 👏
- NEGATIVE: 😡 😤 🤮 🤢 👎 😠 😒 😞 😢 😭 💔 🚫 ❌ 😩 😫 🙄 😣 😖 🤬 ⚠️ 💀 ☠️ 😰 😨 😱
- NEUTRAL: 😐 🤔 😶 🫤 🤷 📝 📌 ℹ️ 🔔 📢 🙂 😏 🫡

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
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this review text (ignore any star rating):\n\n"${review.feedback}"` }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "classify_sentiment",
                description: "Classify the sentiment of a customer review with full multilingual analysis",
                parameters: {
                  type: "object",
                  properties: {
                    sentiment: {
                      type: "string",
                      enum: ["positive", "negative", "neutral"],
                      description: "The overall sentiment. If ANY strong negative phrase exists, must be 'negative'."
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence score from 0 to 100"
                    },
                    language: {
                      type: "string",
                      description: "Detected language codes, e.g. 'en', 'tl', 'ilo', 'ceb', 'tl+en', 'ilo+tl'"
                    },
                    translated_text: {
                      type: "string",
                      description: "The review translated/normalized into clear English"
                    },
                    has_concern: {
                      type: "boolean",
                      description: "true if the review contains complaints, delays, bad service, wrong orders, missing items, questions, or requests"
                    },
                    issue: {
                      type: "string",
                      description: "Main issue in 2-5 words (e.g. 'Slow service', 'Wrong order'). Empty string if no issue."
                    },
                    aspects: {
                      type: "object",
                      properties: {
                        food: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        service: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        value: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] },
                        experience: { type: "string", enum: ["positive", "negative", "neutral", "not_mentioned"] }
                      },
                      description: "Sentiment for each aspect mentioned in the review"
                    },
                    key_phrases: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key sentiment-bearing phrases from the review (max 3)"
                    },
                    reasoning: {
                      type: "string",
                      description: "ONE sentence only explaining why this sentiment was chosen"
                    },
                    suggested_response: {
                      type: "string",
                      description: "A short, human-like reply to the customer. Polite and natural tone."
                    }
                  },
                  required: ["sentiment", "confidence", "language", "translated_text", "has_concern", "issue", "aspects", "reasoning", "suggested_response"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "classify_sentiment" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({
            ...getFallbackSentiment(review),
            warning: "AI rate limit reached. Used basic sentiment analysis fallback.",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({
            ...getFallbackSentiment(review),
            warning: "AI credits exhausted. Used basic sentiment analysis fallback.",
          }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract structured output from tool call
      let sentiment = "neutral";
      let language = "en";
      let approved = (review.rating >= 4);
      let confidence = 0.5;
      let aspects = {};
      let keyPhrases: string[] = [];
      let reasoning = "";
      let translatedText = "";
      let hasConcern = false;
      let issue = "";
      let suggestedResponse = "";
      
      try {
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const parsed = JSON.parse(toolCall.function.arguments);
          
          sentiment = parsed.sentiment || "neutral";
          confidence = parsed.confidence != null ? (parsed.confidence > 1 ? parsed.confidence / 100 : parsed.confidence) : 0.5;
          language = (parsed.language || "en").toLowerCase().substring(0, 10);
          aspects = parsed.aspects || {};
          keyPhrases = parsed.key_phrases || [];
          reasoning = parsed.reasoning || "";
          translatedText = parsed.translated_text || "";
          hasConcern = parsed.has_concern === true;
          issue = parsed.issue || "";
          suggestedResponse = parsed.suggested_response || "";
          
          // Auto-approve only 4-5 star reviews; lower ratings need manual approval
          approved = (review.rating >= 4);
        }
      } catch (parseError) {
        console.error("Failed to parse tool call response:", parseError);
        sentiment = "neutral";
        approved = (review.rating >= 4);
      }

      return new Response(JSON.stringify({ 
        sentiment, 
        language, 
        approved,
        confidence,
        aspects,
        keyPhrases,
        reasoning,
        translatedText,
        hasConcern,
        issue,
        suggestedResponse
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
    await logToSystem({ endpoint: '/analyze-reviews', method: 'POST', status_code: 500, level: 'error', message: 'Review analysis failed' });
    return new Response(JSON.stringify({ error: "An error occurred. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
