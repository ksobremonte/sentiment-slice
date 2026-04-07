import { useState, useRef, useCallback } from "react";
import { Send, Loader2, Bot, User, Shield, CheckCircle, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { 
  ChatConversation, 
  ChatMessage, 
  useConversationMessages, 
  useSendAdminReply,
  useResolveConversation,
  useToggleAIAutoReply,
} from "@/hooks/useConversations";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ConversationThreadProps {
  conversation: ChatConversation;
  onClose: () => void;
}

const ConversationThread = ({ conversation, onClose }: ConversationThreadProps) => {
  const { data: messages, isLoading } = useConversationMessages(conversation.id);
  const { sendReply } = useSendAdminReply();
  const { resolve } = useResolveConversation();
  const { toggleAIAutoReply } = useToggleAIAutoReply();
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aiAutoEnabled = (conversation as any).ai_auto_enabled ?? true;
  const hasAdminReplied = (conversation as any).has_admin_replied ?? false;

  const broadcastTyping = useCallback(() => {
    supabase
      .from("chat_conversations")
      .update({ admin_typing_at: new Date().toISOString() } as any)
      .eq("id", conversation.id)
      .then();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      supabase
        .from("chat_conversations")
        .update({ admin_typing_at: null } as any)
        .eq("id", conversation.id)
        .then();
    }, 4000);
  }, [conversation.id]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await sendReply(conversation.id, replyText.trim());
      supabase
        .from("chat_conversations")
        .update({ admin_typing_at: null } as any)
        .eq("id", conversation.id)
        .then();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setReplyText("");
      toast.success("Reply sent! Customer will see it in their chat.");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateAIReply = async () => {
    setIsGeneratingAI(true);
    try {
      const conversationMessages = messages?.map(m => ({
        role: m.role === "admin" ? "assistant" : m.role,
        content: m.content,
      })) || [];

      const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-chat`;
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: conversationMessages,
          storeInfo: {
            name: "Pizza Volante",
            location: "Baguio City, Philippines",
            hours: { weekdays: "11:00 AM - 10:00 PM", weekends: "10:00 AM - 11:00 PM" },
            phone: "(074) 123-4567",
            delivery: "Free delivery within Baguio City for orders above ₱500",
          },
          sessionId: conversation.session_id,
          generateOnly: true,
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      // Check if JSON fallback
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.reply) aiText = data.reply;
      } else if (response.body) {
        // Handle SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) aiText += content;
              } catch { /* ignore */ }
            }
          }
        }
      }

      // Strip [SUGGESTIONS] tags
      aiText = aiText.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/gi, "").trim();

      if (aiText) {
        setReplyText(aiText);
        toast.success("AI draft generated — review and send or edit.");
      } else {
        toast.error("AI could not generate a reply");
      }
    } catch (err) {
      console.error("AI reply error:", err);
      toast.error("Failed to generate AI reply");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleResolve = async () => {
    try {
      await resolve(conversation.id);
      toast.success("Conversation marked as resolved");
      onClose();
    } catch {
      toast.error("Failed to resolve conversation");
    }
  };

  const handleToggleAI = async (checked: boolean) => {
    try {
      await toggleAIAutoReply(conversation.id, checked);
      toast.success(checked ? "AI auto-reply enabled" : "AI auto-reply disabled");
    } catch {
      toast.error("Failed to toggle AI mode");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_admin":
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Needs Response</Badge>;
      case "resolved":
        return <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"><CheckCircle className="h-3 w-3" />Resolved</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Active</Badge>;
    }
  };

  const getAIStatusBadge = () => {
    if (aiAutoEnabled && !hasAdminReplied) {
      return <Badge className="gap-1 bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100"><Bot className="h-3 w-3" />AI Active</Badge>;
    }
    if (hasAdminReplied) {
      return <Badge className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><Shield className="h-3 w-3" />Admin Handling</Badge>;
    }
    return null;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4 text-primary" />;
      case "assistant": return <Bot className="h-4 w-4 text-muted-foreground" />;
      default: return <User className="h-4 w-4 text-secondary-foreground" />;
    }
  };

  const getRoleBubbleClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-primary text-primary-foreground";
      case "assistant": return "bg-muted text-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold">Conversation</h3>
            {getStatusBadge(conversation.status)}
            {getAIStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">
            Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {conversation.status !== "resolved" && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">AI Auto</span>
              <Switch
                checked={aiAutoEnabled}
                onCheckedChange={handleToggleAI}
              />
            </div>
          )}
          {conversation.status !== "resolved" && (
            <Button variant="outline" size="sm" onClick={handleResolve} className="rounded-xl">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "admin" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {getRoleIcon(msg.role)}
                  </div>
                )}
                <div className="max-w-[75%] space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize font-medium">
                      {msg.role === "admin" ? "You (Pizza Volante Support)" : msg.role}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    {msg.is_complaint && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">Complaint</Badge>
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 text-sm ${getRoleBubbleClass(msg.role)}`}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {getRoleIcon(msg.role)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Input */}
      {conversation.status !== "resolved" && (
        <div className="p-4 border-t-2 border-border space-y-3">
          <Textarea
            value={replyText}
            onChange={(e) => { setReplyText(e.target.value); broadcastTyping(); }}
            placeholder="Type your reply to the customer..."
            className="min-h-[80px] resize-none rounded-xl border-2"
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleGenerateAIReply}
                disabled={isGeneratingAI}
                className="rounded-full px-4"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                AI Reply
              </Button>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Generate AI draft or type your own
              </p>
            </div>
            <Button 
              onClick={handleSendReply} 
              disabled={isSending || !replyText.trim()}
              className="rounded-xl"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationThread;
