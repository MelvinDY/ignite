import { supabase } from "../lib/supabase";
import { deleteConnection } from "./connections.service";

/**
 * Blocks a user to stop all contact
 * @param userId The UUID of the currently authenticated user
 * @param blockedId The UUID of the user to block
 * @returns 
 */
export async function blockUser(userId: string, blockedId: string): Promise<void> {
  // Ensure blockedId !== userId
  if (userId === blockedId) {
    throw { code: "VALIDATION_ERROR" };
  }

  // Check if the target user exists
  const { data: targetUser, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", blockedId)
    .single();

  if (targetError || !targetUser) {
    throw { code: "NOT_FOUND" };
  }

  // Add row to blocks (unique per pair).
  const { error } = await supabase
    .from("blocks")
    .insert({
      blocker_id: userId,
      blocked_id: blockedId,
    });

  if (error) {
    throw error;
  }

  // Auto-decline/cancel any pending requests between the pair.
  // TODO (the function isnt made yet)
  // Remove existing connection if present.
  deleteConnection(userId, blockedId);
  return;
}