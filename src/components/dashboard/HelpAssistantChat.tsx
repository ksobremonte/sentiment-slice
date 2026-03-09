import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Extract [SUGGESTIONS]...[/SUGGESTIONS] from message content
function parseSuggestions(content: string): { cleanContent: string; suggestions: string[] } {
  const regex = /\[SUGGESTIONS\]\s*([\s\S]*?)\s*\[\/SUGGESTIONS\]/i;
  const match = content.match(regex);
  if (!match) {
    const fallbackRegex = /(\*{0,2}Suggested\s+(?:Follow-Up\s+)?Questions:?\*{0,2}[\s\S]*$)/i;
    const fallbackMatch = content.match(fallbackRegex);
    if (fallbackMatch) {
      const lines = fallbackMatch[1].split("\n").filter(l => l.trim());
      const questions = lines
        .slice(1)
        .map(l => l.replace(/^[-•❓*\s]+/, "").replace(/\*+/g, "").trim())
        .filter(l => l.length > 5 && l.endsWith("?"));
      return { cleanContent: content.replace(fallbackRegex, "").trim(), suggestions: questions.slice(0, 5) };
    }
    return { cleanContent: content, suggestions: [] };
  }
  const suggestions = match[1].split("\n").map(l => l.trim()).filter(l => l.length > 0);
  return { cleanContent: content.replace(regex, "").trim(), suggestions: suggestions.slice(0, 5) };
}

const HelpAssistantChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, suggestions]);

  const handleSendText = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setSuggestions([]);
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/help-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              assistantContent += delta;
              const { cleanContent } = parseSuggestions(assistantContent);
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: cleanContent };
                return updated;
              });
            } catch {}
          }
        }
      }

      // Final parse
      const { cleanContent, suggestions: parsed } = parseSuggestions(assistantContent);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: cleanContent };
        return updated;
      });
      setSuggestions(parsed);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = () => handleSendText(input);

  return (
    <div className="flex flex-col border-2 border-border rounded-2xl bg-card overflow-hidden" style={{ height: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm text-foreground">AI Help Assistant</span>
        <Sparkles className="h-3.5 w-3.5 text-primary/60" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12 space-y-2">
            <Bot className="h-10 w-10 mx-auto text-primary/40" />
            <p className="font-medium">How can I help you today?</p>
            <p className="text-xs">Ask me anything about the Pizza Volante dashboard.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Suggestion buttons */}
        {suggestions.length > 0 && !isStreaming && (
          <div className="flex flex-wrap gap-2 pt-1 pl-7">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSendText(s)}
                className="text-xs px-3 py-1.5 rounded-full border-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-colors text-left leading-snug"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <Bot className="h-5 w-5 text-primary mt-1" />
            <div className="bg-muted rounded-xl px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-3 py-2 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question..."
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          className="h-8 w-8 rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HelpAssistantChat;
