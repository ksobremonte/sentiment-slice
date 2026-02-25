import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, MessageSquare, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const CHECK_REPLIES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-replies`;

interface Message {
  role: "user" | "assistant" | "admin";
  content: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-chat`;

// Store info for the chatbot to reference
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

// Generate or retrieve session ID
const getSessionId = () => {
  const storageKey = "pv-chat-session-id";
  let sessionId = localStorage.getItem(storageKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  return sessionId;
};

const CustomerChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Buongiorno! 🍕 Welcome to ${STORE_INFO.name}! I'm here to help you with store hours, daily specials, and more. How can I assist you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(getSessionId);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Poll for admin replies
  const lastSeenTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!conversationId || !isOpen) return;

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
        const { messages: adminMessages } = await response.json();

        if (adminMessages && adminMessages.length > 0) {
          setMessages((prev) => {
            let updated = [...prev];
            for (const msg of adminMessages) {
              const isDuplicate = updated.some(
                (m) => m.role === "admin" && m.content === msg.content
              );
              if (!isDuplicate) {
                updated = [...updated, { role: "admin", content: msg.content }];
              }
            }
            return updated;
          });
          lastSeenTimestampRef.current = adminMessages[adminMessages.length - 1].created_at;
        }
      } catch (err) {
        console.error("Error polling admin replies:", err);
      }
    };

    const interval = setInterval(pollReplies, 5000);
    pollReplies(); // Initial check

    return () => clearInterval(interval);
  }, [conversationId, isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
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

      // Capture conversation ID from response headers
      const newConversationId = response.headers.get("X-Conversation-Id");
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
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
              setMessages((prev) => {
                const newMessages = [...prev];
                if (newMessages[newMessages.length - 1]?.role === "assistant") {
                  newMessages[newMessages.length - 1].content = assistantContent;
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
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble connecting right now. Please call us at (074) 123-4567 for immediate assistance!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, sessionId, conversationId]);

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
    <div className="fixed z-[9999] bg-card border-2 border-border rounded-3xl shadow-warm flex flex-col overflow-hidden right-2 left-2 top-2 bottom-[4.5rem] md:inset-auto md:bottom-6 md:right-6 md:left-auto md:top-auto md:w-96 md:h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-secondary">
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                  {msg.content || (isLoading && i === messages.length - 1 ? (
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
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t-2 border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about hours, specials..."
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
