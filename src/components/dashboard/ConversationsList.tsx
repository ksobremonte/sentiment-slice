import { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle, Clock, ChevronRight, Trash2, Ban, Bot, Shield, User, Hash } from "lucide-react";
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

type FilterTab = "all" | "pending_admin" | "active" | "resolved";

const ConversationsList = () => {
  const { data: conversations, isLoading } = useConversations();
  const { deleteConversation } = useDeleteConversation();
  const { blockSession } = useBlockSession();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatConversation | null>(null);
  const [blockTarget, setBlockTarget] = useState<ChatConversation | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending_admin":
        return { icon: AlertTriangle, label: "Needs Response", variant: "destructive" as const, className: "", dotClass: "bg-destructive" };
      case "resolved":
        return { icon: CheckCircle, label: "Resolved", variant: "secondary" as const, className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100", dotClass: "bg-emerald-500" };
      default:
        return { icon: Clock, label: "Active", variant: "outline" as const, className: "", dotClass: "bg-amber-500" };
    }
  };

  const pendingCount = conversations?.filter(c => c.status === "pending_admin").length || 0;
  const activeCount = conversations?.filter(c => c.status === "active").length || 0;
  const resolvedCount = conversations?.filter(c => c.status === "resolved").length || 0;
  const totalCount = conversations?.length || 0;

  const filteredConversations = [...(conversations || [])]
    .filter(c => activeFilter === "all" || c.status === activeFilter)
    .sort((a, b) => {
      if (a.status === "pending_admin" && b.status !== "pending_admin") return -1;
      if (a.status !== "pending_admin" && b.status === "pending_admin") return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

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

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "pending_admin", label: "Pending", count: pendingCount },
    { key: "active", label: "Active", count: activeCount },
    { key: "resolved", label: "Resolved", count: resolvedCount },
  ];

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin": return <Shield className="h-3.5 w-3.5 text-primary" />;
      case "assistant": return <Bot className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <User className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Card className="p-6 rounded-3xl border-2">
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
              activeFilter === tab.key
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-secondary/50"
            }`}
          >
            <p className="text-2xl font-bold font-display">{tab.count}</p>
            <p className="text-xs text-muted-foreground font-medium">{tab.label}</p>
            {tab.key === "pending_admin" && tab.count > 0 && (
              <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <Card className="rounded-3xl border-2 overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold">
                {activeFilter === "all" ? "All Conversations" : filterTabs.find(t => t.key === activeFilter)?.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredConversations.length} conversation{filteredConversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {pendingCount > 0 && activeFilter === "all" && (
            <Badge variant="destructive" className="text-sm animate-pulse">
              {pendingCount} need{pendingCount !== 1 ? "" : "s"} response
            </Badge>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No conversations</p>
              <p className="text-sm">
                {activeFilter === "all" ? "Customer chats will appear here" : `No ${activeFilter.replace("_", " ")} conversations`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conv) => {
                const statusInfo = getStatusInfo(conv.status);
                const isAdminHandling = conv.has_admin_replied && !conv.ai_auto_enabled;
                const isAIActive = conv.ai_auto_enabled && !conv.has_admin_replied;

                return (
                  <div
                    key={conv.id}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-secondary/40 transition-all group cursor-pointer"
                    onClick={() => setSelectedConversation(conv)}
                  >
                    {/* Status dot + avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusInfo.dotClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold truncate">
                          Session {conv.session_id.substring(0, 8)}
                        </span>
                        <Badge variant={statusInfo.variant} className={`gap-0.5 text-[10px] px-1.5 py-0 h-4 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                        {isAIActive && (
                          <Badge className="gap-0.5 text-[10px] px-1.5 py-0 h-4 bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100">
                            <Bot className="h-2.5 w-2.5" />AI
                          </Badge>
                        )}
                        {isAdminHandling && (
                          <Badge className="gap-0.5 text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            <Shield className="h-2.5 w-2.5" />Admin
                          </Badge>
                        )}
                      </div>
                      {conv.last_message ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {getRoleIcon(conv.last_message_role)}
                          <span className="truncate">{conv.last_message}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No messages yet</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </p>
                        {(conv.message_count ?? 0) > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <Hash className="h-3 w-3 text-muted-foreground/60" />
                            <span className="text-[10px] text-muted-foreground/60">{conv.message_count} msgs</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setBlockTarget(conv); }}
                          title="Block session"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(conv); }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
