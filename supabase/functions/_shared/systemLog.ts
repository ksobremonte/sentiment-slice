import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LogEntry {
  endpoint: string;
  method: string;
  status_code: number;
  level: "success" | "warning" | "error" | "info";
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Logs an entry to the system_logs table.
 * Uses service role to bypass RLS.
 * Fire-and-forget — errors are caught silently to avoid breaking the main flow.
 */
export async function logToSystem(entry: LogEntry): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    await supabase.from("system_logs").insert({
      endpoint: entry.endpoint,
      method: entry.method,
      status_code: entry.status_code,
      level: entry.level,
      message: entry.message,
      details: entry.details || null,
    });
  } catch (err) {
    console.error("[systemLog] Failed to write log:", err);
  }
}

/** Determine log level from HTTP status code */
export function levelFromStatus(status: number): "success" | "warning" | "error" {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  return "error";
}
