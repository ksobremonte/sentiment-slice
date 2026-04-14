// Edge function for customer chat with persistent conversations and admin replies

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "X-Conversation-Id",
};

interface Message {
  role: "user" | "assistant" | "admin" | "system";
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

interface Review {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  created_at: string;
}

interface MessageClassification {
  is_feedback: boolean;
  category: "complaint" | "concern" | "question" | "praise" | "none";
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  summary: string;
  language: string;
  is_flagged: boolean;
  flag_reason: string;
}

// Classify message for sentiment, language, feedback, and hate speech
async function classifyMessage(message: string, lovableApiKey: string): Promise<MessageClassification> {
  const classificationPrompt = `You are a message classifier for a pizza restaurant. Analyze the customer message and determine:

1. FEEDBACK DETECTION: Is this genuine feedback about the restaurant experience? (food, service, cleanliness, delivery, pricing)
   - Only classify as feedback if SINCERE. Greetings, menu questions, or casual chat are NOT feedback.

2. LANGUAGE DETECTION: Detect the language of the message (ISO 639-1 code).

3. SENTIMENT ANALYSIS: Determine sentiment PURELY from the text, ignoring any ratings.

4. CONTENT MODERATION: Check for insults, hate speech, obscene language, threats, or abusive content.

Respond with a JSON object:
{
  "is_feedback": boolean,
  "category": "complaint" | "concern" | "question" | "praise" | "none",
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": number (0-1),
  "summary": string (brief summary, max 100 chars),
  "language": string (ISO 639-1 code, e.g. "en", "tl", "ilo"),
  "is_flagged": boolean (true if contains hate speech, insults, obscene language, threats),
  "flag_reason": string (reason for flagging, empty if not flagged)
}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: classificationPrompt },
          { role: "user", content: `Classify this customer message: "${message}"` }
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("Classification API error:", await response.text());
      return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "", language: "en", is_flagged: false, flag_reason: "" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        is_feedback: parsed.is_feedback ?? false,
        category: parsed.category ?? "none",
        sentiment: parsed.sentiment ?? "neutral",
        confidence: parsed.confidence ?? 0,
        summary: parsed.summary ?? "",
        language: (parsed.language ?? "en").toLowerCase().substring(0, 5),
        is_flagged: parsed.is_flagged ?? false,
        flag_reason: parsed.flag_reason ?? "",
      };
    }
    
    return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "", language: "en", is_flagged: false, flag_reason: "" };
  } catch (error) {
    console.error("Error classifying message:", error);
    return { is_feedback: false, category: "none", sentiment: "neutral", confidence: 0, summary: "", language: "en", is_flagged: false, flag_reason: "" };
  }
}

// Check if a session is blocked
async function isSessionBlocked(
  supabase: ReturnType<typeof createClient>,
  sessionId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("blocked_sessions")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();
  return !!data;
}

// Get or create a conversation
async function getOrCreateConversation(
  supabase: ReturnType<typeof createClient>,
  sessionId: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("chat_conversations")
    .insert({ session_id: sessionId })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
  return created.id;
}

// Save a message to the database with sentiment, language, and status (with deduplication)
async function saveMessage(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  role: "user" | "assistant" | "admin",
  content: string,
  options: {
    isComplaint?: boolean;
    sentiment?: string;
    language?: string;
    status?: string;
  } = {}
): Promise<void> {
  // Deduplication: check if an identical message was saved in the last 60 seconds
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: existing } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("role", role)
    .eq("content", content)
    .gte("created_at", cutoff)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Skipping duplicate message:", content.substring(0, 50));
    return;
  }

  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    is_complaint: options.isComplaint ?? false,
    sentiment: options.sentiment ?? null,
    language: options.language ?? null,
    status: options.status ?? "approved",
  });

  if (error) {
    console.error("Error saving message:", error);
  }
}

// Fetch admin messages that the customer hasn't seen yet
async function fetchAdminReplies(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  lastKnownMessageCount: number
): Promise<Message[]> {
  const { data: allMessages, error } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error || !allMessages) return [];

  const newMessages = allMessages.slice(lastKnownMessageCount);
  return newMessages
    .filter((m: { role: string }) => m.role === "admin")
    .map((m: { role: string; content: string }) => ({ role: m.role as "admin", content: m.content }));
}

// Save feedback as a review linked to conversation
async function saveFeedbackAsReview(
  supabase: ReturnType<typeof createClient>,
  feedback: string,
  classification: MessageClassification,
  conversationId: string
): Promise<void> {
  try {
    await supabase
      .from("chat_conversations")
      .update({ status: "pending_admin" })
      .eq("id", conversationId);

    // Determine approval: only English + not flagged + high confidence
    const approved = classification.language === "en" && !classification.is_flagged && classification.confidence >= 0.6;

    // Assign rating based on sentiment: negative/complaint → 1, neutral → 3, positive → 4
    const rating = classification.sentiment === "negative" || classification.is_complaint ? 1
      : classification.sentiment === "positive" ? 4
      : 3;

    // Check for existing review with same feedback in same conversation
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("feedback", feedback)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("Skipping duplicate review for conversation:", conversationId);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      name: "Chat Visitor",
      email: "chat-feedback@pizzavolante.local",
      rating,
      feedback: feedback,
      sentiment: classification.sentiment,
      approved,
      language: classification.language,
      conversation_id: conversationId,
    });

    if (error) {
      console.error("Error saving chat feedback:", error);
    } else {
      console.log("Chat feedback saved:", { summary: classification.summary, approved, flagged: classification.is_flagged });
    }
  } catch (error) {
    console.error("Error in saveFeedbackAsReview:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeInfo, sessionId, messageCount, generateOnly } = await req.json() as { 
      messages: Message[]; 
      storeInfo: StoreInfo;
      sessionId?: string;
      messageCount?: number;
      generateOnly?: boolean;
    };

    // Input validation
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages (max 50)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const msg of messages) {
      if (msg.content && typeof msg.content === "string" && msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message too long (max 10000 chars)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg.role && !["user", "assistant", "admin", "system"].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (sessionId && (typeof sessionId !== "string" || sessionId.length > 100)) {
      return new Response(JSON.stringify({ error: "Invalid sessionId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!supabaseUrl || !supabaseKey || !lovableApiKey) {
      console.error("Missing required environment configuration");
      return new Response(JSON.stringify({ error: "Service configuration error. Please try again later." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if session is blocked
    if (sessionId) {
      const blocked = await isSessionBlocked(supabase, sessionId);
      if (blocked) {
        return new Response(JSON.stringify({ 
          reply: "This session has been restricted. Please contact the restaurant directly for assistance." 
        }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let conversationId: string | null = null;
    if (sessionId) {
      conversationId = await getOrCreateConversation(supabase, sessionId);
    }

    let adminReplies: Message[] = [];
    if (conversationId && typeof messageCount === "number") {
      adminReplies = await fetchAdminReplies(supabase, conversationId, messageCount);
    }

    const latestUserMessage = messages.filter(m => m.role === "user").pop();
    
    // Classify every user message for sentiment, language, and content moderation
    if (latestUserMessage && conversationId) {
      classifyMessage(latestUserMessage.content, lovableApiKey).then(async (classification) => {
        // Determine message status
        let messageStatus = "approved";
        if (classification.is_flagged) {
          messageStatus = "flagged";
        } else if (classification.language !== "en") {
          messageStatus = "pending_review";
        }

        // Save user message with full classification data
        await saveMessage(supabase, conversationId!, "user", latestUserMessage.content, {
          isComplaint: classification.is_feedback && classification.category === "complaint",
          sentiment: classification.sentiment,
          language: classification.language,
          status: messageStatus,
        });

        // Save as review if genuine feedback with sufficient confidence
        if (classification.is_feedback && classification.confidence >= 0.7) {
          console.log("Detected feedback:", classification);
          await saveFeedbackAsReview(supabase, latestUserMessage.content, classification, conversationId!);
        }

        if (classification.is_flagged) {
          console.log("⚠️ Flagged message:", classification.flag_reason);
        }
      }).catch(err => console.error("Background classification error:", err));
    } else if (latestUserMessage && conversationId) {
      // Fallback: save without classification
      await saveMessage(supabase, conversationId, "user", latestUserMessage.content);
    }

    // Check if AI auto-reply is disabled for this conversation
    let aiAutoEnabled = true;
    if (conversationId) {
      const { data: convoData } = await supabase
        .from("chat_conversations")
        .select("ai_auto_enabled, has_admin_replied")
        .eq("id", conversationId)
        .single();
      if (convoData) {
        aiAutoEnabled = convoData.ai_auto_enabled ?? true;
      }
    }

    // If AI auto-reply is disabled AND this is NOT a manual generateOnly request, skip AI
    if (!aiAutoEnabled && !generateOnly) {
      return new Response(JSON.stringify({ 
        reply: null, 
        adminReplies,
        aiDisabled: true 
      }), {
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Conversation-Id": conversationId || "",
        },
      });
    }

    // Fetch approved reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews_public")
      .select("id, name, rating, feedback, sentiment, created_at")
      .eq("approved", true)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (reviewsError) console.error("Error fetching reviews:", reviewsError);

    const highRatedReviews = (reviews || []).filter((r: Review) => r.rating >= 4);
    const otherReviews = (reviews || []).filter((r: Review) => r.rating < 4);

    const formatReviews = (reviewList: Review[]) => {
      if (!reviewList || reviewList.length === 0) return "No reviews available.";
      return reviewList.map((r: Review) => 
        `- ${r.name} (${r.rating}★): "${r.feedback}" [${new Date(r.created_at).toLocaleDateString()}]`
      ).join("\n");
    };

    const totalReviews = (reviews || []).length;
    const avgRating = totalReviews > 0 
      ? ((reviews || []).reduce((sum: number, r: Review) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : "N/A";
    const fiveStarCount = (reviews || []).filter((r: Review) => r.rating === 5).length;
    const fourStarCount = (reviews || []).filter((r: Review) => r.rating === 4).length;

    const adminContext = adminReplies.length > 0
      ? `\n\nRECENT ADMIN REPLIES TO THIS CUSTOMER:\n${adminReplies.map(m => `- Admin: "${m.content}"`).join("\n")}\nPlease acknowledge the admin's response and continue the conversation naturally.`
      : "";

    const systemPrompt = `You are a helpful, neutral assistant for ${storeInfo.name}. Your job is to answer customer questions using ONLY real customer reviews and sentiment analysis data.

RESPONSE RULES:
1. **Answer the user's question directly in the first sentence.** Do NOT start with greetings, promotions, or menu suggestions.
2. Base all responses on the customer reviews and sentiment data provided below.
3. Summarize review insights in 2–3 short bullet points. Highlight key terms in **bold**.
4. **Keep responses under 5 lines.** Be concise. Do NOT write long analysis reports or repeat the same information.
5. Acknowledge complaints empathetically but briefly.

Do NOT include in responses:
• Promotions or daily deals
• Menu advertisements or best-seller lists
• Phone numbers or ordering instructions
• Sales language or upselling
• Invented or fabricated reviews

After answering, ALWAYS add exactly 3–5 suggested follow-up questions in this EXACT format (one per line, no bullet points or emoji):

[SUGGESTIONS]
What do customers say about the pizza quality?
Which menu items receive the best reviews?
Are there common complaints from customers?
What is the overall customer sentiment?
[/SUGGESTIONS]

The suggestions MUST be wrapped in [SUGGESTIONS] and [/SUGGESTIONS] tags. Do NOT use any other format for suggestions. Do NOT include a "Suggested Questions:" header in the main response.

STORE INFO (use only if directly asked): ${storeInfo.name}, ${storeInfo.location} | Weekdays ${storeInfo.hours.weekdays}, Weekends ${storeInfo.hours.weekends}

REVIEW DATA (${totalReviews} total reviews, ${avgRating}★ average, ${fiveStarCount} five-star, ${fourStarCount} four-star):

HIGH-RATED REVIEWS:
${formatReviews(highRatedReviews)}

OTHER REVIEWS:
${otherReviews.length > 0 ? formatReviews(otherReviews) : "No lower-rated reviews available."}
${adminContext}

RULES: Only quote REAL reviews above. Never invent reviews. Stay polite. Never expose moderation logic.`;

    const allMessagesForAI = [
      ...messages.filter((m) => m.role === "user" || m.role === "assistant"),
      ...adminReplies.map(m => ({ role: "assistant" as const, content: `[Pizza Volante Support] ${m.content}` })),
    ];

    const apiMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...allMessagesForAI,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: true,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        // Fallback response when AI is unavailable
        const fallbackReply = `Thank you for your message! Our AI assistant is temporarily unavailable, but here's some helpful info:\n\n• **${storeInfo.name}** is located in ${storeInfo.location}\n• **Hours:** Weekdays ${storeInfo.hours.weekdays}, Weekends ${storeInfo.hours.weekends}\n• **Phone:** ${storeInfo.phone}\n• **Delivery:** ${storeInfo.delivery}\n\nFor more detailed questions, please visit us in person or call us!`;

        if (conversationId) {
          await saveMessage(supabase, conversationId, "assistant", fallbackReply);
        }

        return new Response(JSON.stringify({ reply: fallbackReply, adminReplies }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error("Failed to get response from AI");
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.body!.getReader();
    
    let fullAssistantResponse = "";
    
    (async () => {
      try {
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          await writer.write(value);
          
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullAssistantResponse += content;
              } catch { /* ignore */ }
            }
          }
        }
        await writer.close();
        
        if (conversationId && fullAssistantResponse && !generateOnly) {
          await saveMessage(supabase, conversationId, "assistant", fullAssistantResponse);
        }
      } catch (err) {
        console.error("Error in stream processing:", err);
        await writer.abort(err);
      }
    })();

    await logToSystem({ endpoint: '/customer-chat', method: 'POST', status_code: 200, level: 'success', message: 'Customer chat response streamed' });
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Conversation-Id": conversationId || "",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    await logToSystem({ endpoint: '/customer-chat', method: 'POST', status_code: 500, level: 'error', message: 'Customer chat error' });
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
