import { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useConversations, ChatConversation } from "@/hooks/useConversations";
import ConversationThread from "./ConversationThread";
import { formatDistanceToNow } from "date-fns";

const ConversationsList = () => {
  const { data: conversations, isLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending_admin":
        return { icon: AlertTriangle, label: "Needs Response", variant: "destructive" as const, className: "" };
      case "resolved":
        return { icon: CheckCircle, label: "Resolved", variant: "secondary" as const, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100" };
      default:
        return { icon: Clock, label: "Active", variant: "outline" as const, className: "" };
    }
  };

  // Sort conversations: pending_admin first, then by updated_at
  const sortedConversations = [...(conversations || [])].sort((a, b) => {
    if (a.status === "pending_admin" && b.status !== "pending_admin") return -1;
    if (a.status !== "pending_admin" && b.status === "pending_admin") return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const pendingCount = conversations?.filter(c => c.status === "pending_admin").length || 0;

  if (isLoading) {
    return (
      <Card className="p-6 rounded-3xl border-2">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 rounded-3xl border-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">Customer Conversations</h3>
              <p className="text-sm text-muted-foreground">
                {conversations?.length || 0} total conversations
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[400px] pr-2">
          {sortedConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No conversations yet</p>
              <p className="text-sm">Customer chats will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedConversations.map((conv) => {
                const statusInfo = getStatusInfo(conv.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className={`gap-1 ${statusInfo.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          Session: {conv.session_id.slice(0, 8)}...
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </Card>

      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 rounded-3xl overflow-hidden">
          {selectedConversation && (
            <ConversationThread 
              conversation={selectedConversation} 
              onClose={() => setSelectedConversation(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConversationsList;
