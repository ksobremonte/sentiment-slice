import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ConversationsList from "@/components/dashboard/ConversationsList";

const DashboardConversations = () => {
  return (
    <DashboardLayout>
      <h2 className="text-xl font-display font-bold text-foreground mb-6">Customer Conversations</h2>
      <ConversationsList />
    </DashboardLayout>
  );
};

export default DashboardConversations;
