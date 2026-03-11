import { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight, Trash2, Ban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useConversations, ChatConversation, useDeleteConversation, useBlockSession } from "@/hooks/useConversations";
import ConversationThread from "./ConversationThread";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const ConversationsList = () => {
  const { data: conversations, isLoading } = useConversations();
  const { deleteConversation } = useDeleteConversation();
  const { blockSession } = useBlockSession();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(null);
  const [blockTarget, setBlockTarget] = useState<ChatConversation | null>(null);

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

  const sortedConversations = [...(conversations || [])].sort((a, b) => {
    if (a.status === "pending_admin" && b.status !== "pending_admin") return -1;
    if (a.status !== "pending_admin" && b.status === "pending_admin") return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const pendingCount = conversations?.filter(c => c.status === "pending_admin").length || 0;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConversation(deleteTarget.id);
      toast.success("Conversation deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete conversation");
    }
  };

  const handleBlock = async () => {
    if (!blockTarget) return;
    try {
      await blockSession(blockTarget.session_id);
      toast.success("Session blocked. This user can no longer send messages.");
      setBlockTarget(null);
    } catch {
      toast.error("Failed to block session");
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 rounded-3xl border-2">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
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

        <div className="max-h-[400px] overflow-y-auto pr-1">
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
                  <div
                    key={conv.id}
                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                  >
                    <button
                      onClick={() => setSelectedConversation(conv)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className={`gap-1 text-[10px] px-1.5 py-0.5 ${statusInfo.className}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setBlockTarget(conv); }}
                        title="Block this session"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); }}
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Conversation Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 rounded-3xl overflow-hidden flex flex-col">
          <VisuallyHidden>
            <DialogTitle>Conversation Thread</DialogTitle>
          </VisuallyHidden>
          {selectedConversation && (
            <ConversationThread 
              conversation={selectedConversation} 
              onClose={() => setSelectedConversation(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation */}
      <AlertDialog open={!!blockTarget} onOpenChange={() => setBlockTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Block This Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will block this user's session from sending any more messages. All their conversations will be marked as resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConversationsList;
