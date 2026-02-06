import { useState } from "react";
import { MessageSquareReply, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AdminResponseDialogProps {
  reviewId: string;
  reviewerName: string;
  existingResponse?: string | null;
}

const AdminResponseDialog = ({
  reviewId,
  reviewerName,
  existingResponse,
}: AdminResponseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState(existingResponse || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          admin_response: response.trim(),
          admin_response_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Response saved",
        description: `Your response to ${reviewerName} has been saved.`,
      });

      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setOpen(false);
    } catch (error) {
      console.error("Error saving response:", error);
      toast({
        title: "Error",
        description: "Failed to save response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-2 font-semibold hover:bg-secondary"
        >
          <MessageSquareReply className="w-4 h-4 mr-2" />
          {existingResponse ? "Edit Response" : "Respond"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display">
            Respond to {reviewerName}
          </DialogTitle>
          <DialogDescription>
            Your response will be visible to admins and can help address customer feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your response to this feedback..."
            className="min-h-[120px] resize-none rounded-xl border-2"
          />
          <p className="text-xs text-muted-foreground">
            {response.length}/500 characters
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !response.trim()}
            className="rounded-xl"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Save Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminResponseDialog;
