import { useState } from "react";
import { Send, Loader2, Bot, User, Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ChatConversation, 
  ChatMessage, 
  useConversationMessages, 
  useSendAdminReply,
  useResolveConversation 
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
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      await sendReply(conversation.id, replyText.trim());
      setReplyText("");
      toast.success("Reply sent! Customer will see it in their chat.");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async () => {
    try {
      await resolve(conversation.id);
      toast.success("Conversation marked as resolved");
      onClose();
    } catch (error) {
      toast.error("Failed to resolve conversation");
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4 text-primary" />;
      case "assistant":
        return <Bot className="h-4 w-4 text-muted-foreground" />;
      default:
        return <User className="h-4 w-4 text-secondary-foreground" />;
    }
  };

  const getRoleBubbleClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary text-primary-foreground";
      case "assistant":
        return "bg-muted text-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold">Conversation</h3>
            {getStatusBadge(conversation.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Started {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
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
      <ScrollArea className="flex-1 p-4">
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
                      {msg.role === "admin" ? "You" : msg.role}
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
      </ScrollArea>

      {/* Reply Input */}
      {conversation.status !== "resolved" && (
        <div className="p-4 border-t-2 border-border space-y-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply to the customer..."
            className="min-h-[80px] resize-none rounded-xl border-2"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Your reply will appear in the customer's chat window
            </p>
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
