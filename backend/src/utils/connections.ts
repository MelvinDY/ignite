import { supabase } from "../lib/supabase";

/**
 * Safely check if A has blocked B. If blocks table is missing, treat as false.
 * Adjust table/column names if your actual schema differs.
 */
async function safeIsBlocked(a: string, b: string): Promise<boolean> {
  try {
    // Try a canonical "profile_blocks" table first
    let q = supabase
      .from("profile_blocks")
      .select("id")
      .eq("blocker_id", a)
      .eq("blocked_id", b)
      .maybeSingle();

    let { data, error } = await q;
    if (!error) return !!data;

    // Fallback to "blocks" table if you used a different name
    const fb = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", a)
      .eq("blocked_id", b)
      .maybeSingle();

    if (fb.error) {
      // If table truly doesn't exist, treat as not blocked
      return false;
    }
    return !!fb.data;
  } catch {
    return false;
  }
}

/** undirected connection exists */
async function pairConnected(a: string, b: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("connections")
    .select("user_id_a,user_id_b")
    .or(
      `and(user_id_a.eq.${a},user_id_b.eq.${b}),and(user_id_a.eq.${b},user_id_b.eq.${a})`
    )
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/** pending outgoing request from a -> b */
async function pendingOutgoing(a: string, b: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("sender_id", a)
    .eq("receiver_id", b)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/** pending incoming request from b -> a */
async function pendingIncoming(a: string, b: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("sender_id", b)
    .eq("receiver_id", a)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  return !!data;
}