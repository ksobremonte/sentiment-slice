import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Archive a record: insert into archived_records then delete from source table.
 */
export const useArchiveRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceTable,
      recordId,
      recordData,
    }: {
      sourceTable: string;
      recordId: string;
      recordData: Record<string, unknown>;
    }) => {
      // 1. Insert into archive
      const { error: archiveError } = await supabase
        .from("archived_records")
        .insert({
          source_table: sourceTable,
          record_id: recordId,
          record_data: recordData as any,
          deleted_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (archiveError) throw archiveError;

      // 2. Delete from source
      const { error: deleteError } = await supabase
        .from(sourceTable as any)
        .delete()
        .eq("id", recordId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-records"] });
      toast.success("Record archived successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to archive: " + err.message);
    },
  });
};

/**
 * Restore an archived record back to its source table.
 */
export const useRestoreRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (archiveId: string) => {
      // 1. Get the archived record
      const { data: archived, error: fetchError } = await supabase
        .from("archived_records")
        .select("*")
        .eq("id", archiveId)
        .single();

      if (fetchError || !archived) throw fetchError || new Error("Record not found");

      const recordData = archived.record_data as Record<string, unknown>;

      // 2. Re-insert into original table
      const { error: insertError } = await supabase
        .from(archived.source_table as any)
        .insert(recordData as any);

      if (insertError) throw insertError;

      // 3. Remove from archive
      const { error: deleteError } = await supabase
        .from("archived_records")
        .delete()
        .eq("id", archiveId);

      if (deleteError) throw deleteError;

      return archived.source_table;
    },
    onSuccess: (sourceTable) => {
      queryClient.invalidateQueries({ queryKey: ["archived-records"] });
      queryClient.invalidateQueries({ queryKey: [sourceTable] });
      toast.success("Record restored successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to restore: " + err.message);
    },
  });
};

/**
 * Permanently delete an archived record.
 */
export const usePermanentDelete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (archiveId: string) => {
      const { error } = await supabase
        .from("archived_records")
        .delete()
        .eq("id", archiveId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["archived-records"] });
      toast.success("Record permanently deleted");
    },
    onError: (err: any) => {
      toast.error("Failed to delete: " + err.message);
    },
  });
};
