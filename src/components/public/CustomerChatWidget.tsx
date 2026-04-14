import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, MessageSquare, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

const CHECK_REPLIES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-replies`;

interface Message {
  role: "user" | "assistant" | "admin";
  content: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-chat`;

const STORE_INFO = {
  name: "Pizza Volante",
  location: "Baguio City, Philippines",
  hours: {
    weekdays: "11:00 AM - 10:00 PM",
    weekends: "10:00 AM - 11:00 PM",
  },
  phone: "(074) 123-4567",
  delivery: "Free delivery within Baguio City for orders above ₱500",
};

const getSessionId = () => {
  const storageKey = "pv-chat-session-id";
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

const getStoredConversationId = (): string | null => {
  return localStorage.getItem("pv-chat-conversation-id");
};

const storeConversationId = (id: string) => {
  localStorage.setItem("pv-chat-conversation-id", id);
};

// Extract [SUGGESTIONS]...[/SUGGESTIONS] from message content
function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const regex = /\[SUGGESTIONS\]\s*([\s\S]*?)\s*\[\/SUGGESTIONS\]/i;
  const match = content.match(regex);
  if (!match) {
    const fallbackRegex = /(\*{0,2}Suggested\s+(?:Follow-Up\s+)?Questions:?\*{0,2}[\s\S]*$)/i;
    const fallbackMatch = content.match(fallbackRegex);
    if (fallbackMatch) {
      const suggestionsText = fallbackMatch[1];
      const lines = suggestionsText.split("\n").filter(l => l.trim());
      const questions = lines
        .slice(1)
        .map(l => l.replace(/^[-•❓*\s]+/, "").replace(/\*+/g, "").trim())
        .filter(l => l.length > 5 && l.endsWith("?"));
      return {
        cleanContent: content.replace(fallbackRegex, "").trim(),
        suggestions: questions.slice(0, 5),
      };
    }
    return { cleanContent: content, suggestions: [] };
  }

  const suggestionsBlock = match[1];
  const suggestions = suggestionsBlock
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const cleanContent = content.replace(regex, "").trim();
  return { cleanContent, suggestions: suggestions.slice(0, 5) };
}

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Welcome to ${STORE_INFO.name}! 🍕 How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [conversationId, setConversationId] = useState<string | null>(getStoredConversationId);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const initialSuggestions = [
    "What's on the menu?",
    "What are your opening hours?",
    "Do you offer delivery?",
    "Where are you located?",
  ];
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist conversationId whenever it changes
  useEffect(() => {
    if (conversationId) {
      storeConversationId(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, suggestions, adminTyping]);

  // Load conversation history on mount if we have a stored conversationId
  useEffect(() => {
    if (!conversationId || historyLoaded) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(CHECK_REPLIES_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            conversationId,
            loadAll: true,
          }),
        });

        if (!response.ok) return;
        const { messages: allMessages } = await response.json();

        if (allMessages && allMessages.length > 0) {
          const restored: Message[] = allMessages.map((m: any) => ({
            role: m.role as Message["role"],
            content: m.content,
          }));
          // Prepend the welcome message
          setMessages([
            { role: "assistant", content: `Welcome to ${STORE_INFO.name}! 🍕 How can I help you today?` },
            ...restored,
          ]);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [conversationId, historyLoaded]);

  // Poll for admin replies + Realtime enhancement
  const lastSeenTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !isOpen) return;

    const handleAdminMessage = (msg: { content: string; created_at?: string }) => {
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) => m.role === "admin" && m.content === msg.content
        );
        if (isDuplicate) return prev;
        return [...prev, { role: "admin", content: msg.content }];
      });
      if (msg.created_at) {
        lastSeenTimestampRef.current = msg.created_at;
      }
    };

    // Polling fallback (works for unauthenticated customers)
    const pollReplies = async () => {
      try {
        const response = await fetch(CHECK_REPLIES_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            conversationId,
            lastSeenTimestamp: lastSeenTimestampRef.current,
          }),
        });

        if (!response.ok) return;
        const data = await response.json();
        const adminMessages = data.messages;
        setAdminTyping(!!data.adminTyping);

        if (adminMessages && adminMessages.length > 0) {
          for (const msg of adminMessages) {
            handleAdminMessage(msg);
          }
          lastSeenTimestampRef.current = adminMessages[adminMessages.length - 1].created_at;
        }
      } catch (err) {
        console.error("Error polling admin replies:", err);
      }
    };

    const interval = setInterval(pollReplies, 3000);
    pollReplies();

    // Realtime subscription for instant delivery (when RLS permits)
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.role === 'admin') {
            handleAdminMessage(msg);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [conversationId, isOpen]);

  const sendMessageWithText = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setSuggestions([]);
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          storeInfo: STORE_INFO,
          sessionId,
          messageCount: updatedMessages.length,
        }),
      });

      const newConversationId = response.headers.get("X-Conversation-Id");
      if (newConversationId) {
        setConversationId(newConversationId);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Check if response is JSON (fallback) or stream
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.aiDisabled) {
          // AI auto-reply disabled — admin is handling this conversation
          setIsLoading(false);
          return;
        }
        if (data.reply) {
          assistantContent = data.reply;
          const { cleanContent, suggestions: parsed } = parseSuggestions(assistantContent);
          setMessages((prev) => [...prev, { role: "assistant", content: cleanContent }]);
          setSuggestions(parsed);
          setIsLoading(false);
          return;
        }
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const { cleanContent } = parseSuggestions(assistantContent);
              setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1]?.role === "assistant") {
                  newMessages[newMessages.length - 1].content = cleanContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final parse to extract suggestions
      const { cleanContent, suggestions: parsed } = parseSuggestions(assistantContent);
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1]?.role === "assistant") {
          newMessages[newMessages.length - 1].content = cleanContent;
        }
        return newMessages;
      });
      setSuggestions(parsed);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, sessionId, conversationId]);

  const sendMessage = useCallback(() => {
    sendMessageWithText(input);
  }, [input, sendMessageWithText]);

  const handleSuggestionClick = (suggestion: string) => {
    sendMessageWithText(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed z-[9999]" style={{ bottom: '5rem', right: '1rem', left: 'auto' }}>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-warm bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageSquare className="h-6 w-6 md:h-7 md:w-7" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed z-[9999] bg-card border-2 border-border rounded-3xl shadow-warm flex flex-col overflow-hidden right-2 left-2 bottom-[4.5rem] md:inset-auto md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-96 md:h-[520px]" style={{ top: 'auto', maxHeight: 'calc(100dvh - 6rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border bg-secondary flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="font-display font-semibold text-secondary-foreground block">Pizza Volante</span>
            <span className="text-xs text-muted-foreground">How can we help?</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-secondary-foreground hover:bg-secondary-foreground/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {(msg.role === "assistant" || msg.role === "admin") && (
                <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "admin" ? "bg-primary/20" : "bg-primary/10"
                }`}>
                  {msg.role === "admin" ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <Bot className="h-5 w-5 text-primary" />
                  )}
                </div>
              )}
              <div className="max-w-[80%] space-y-1">
                {msg.role === "admin" && (
                  <span className="text-xs font-medium text-primary">Pizza Volante Support</span>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.role === "admin"
                      ? "bg-primary/10 text-foreground border-2 border-primary/20"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0 [&>p+p]:mt-2 [&>ul]:pl-4 [&>ol]:pl-4">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (isLoading && i === messages.length - 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null)}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Admin typing indicator */}
          {adminTyping && !isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-muted text-foreground">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground italic">Admin is typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestion buttons */}
          {suggestions.length > 0 && !isLoading && (
            <div className="flex flex-wrap gap-2 pt-1 pl-12">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs px-3 py-1.5 rounded-full border-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-colors text-left leading-snug"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 rounded-xl border-2"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-xl h-10 w-10"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatWidget;
