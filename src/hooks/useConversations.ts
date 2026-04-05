import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "admin";
  content: string;
  created_at: string;
  is_complaint: boolean;
  sentiment: string | null;
}

export interface ChatConversation {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  status: "active" | "resolved" | "pending_admin";
  has_admin_replied?: boolean;
  ai_auto_enabled?: boolean;
  messages?: ChatMessage[];
  last_message?: string;
  last_message_role?: string;
  message_count?: number;
}

export const useConversations = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["conversation-messages"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as ChatConversation[];
    },
  });
};

export const useConversationMessages = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!conversationId,
  });
};

export const useSendAdminReply = () => {
  const queryClient = useQueryClient();

  const sendReply = async (conversationId: string, content: string) => {
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role: "admin",
      content,
      is_complaint: false,
    });

    if (error) throw error;

    // Update conversation status + mark admin as active, disable AI auto-reply
    await supabase
      .from("chat_conversations")
      .update({ 
        status: "active",
        has_admin_replied: true,
        ai_auto_enabled: false,
      } as any)
      .eq("id", conversationId);

    queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { sendReply };
};

export const useToggleAIAutoReply = () => {
  const queryClient = useQueryClient();

  const toggleAIAutoReply = async (conversationId: string, enabled: boolean) => {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ ai_auto_enabled: enabled } as any)
      .eq("id", conversationId);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { toggleAIAutoReply };
};

export const useResolveConversation = () => {
  const queryClient = useQueryClient();

  const resolve = async (conversationId: string) => {
    const { error } = await supabase
      .from("chat_conversations")
      .update({ status: "resolved" })
      .eq("id", conversationId);

    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { resolve };
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  const deleteConversation = async (conversationId: string) => {
    // Delete messages first, then conversation
    const { error: msgError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("conversation_id", conversationId);
    if (msgError) throw msgError;

    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", conversationId);
    if (error) throw error;

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { deleteConversation };
};

export const useBlockSession = () => {
  const queryClient = useQueryClient();

  const blockSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("blocked_sessions")
      .insert({ session_id: sessionId });
    if (error) throw error;

    // Also update all conversations from this session to resolved
    await supabase
      .from("chat_conversations")
      .update({ status: "resolved" })
      .eq("session_id", sessionId);

    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  return { blockSession };
};
