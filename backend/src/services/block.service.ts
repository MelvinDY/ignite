import { supabase } from "../lib/supabase";
import { cancelConnectionRequest, deleteConnection } from "./connections.service";

/**
 * Cancel/decline all pending requests between two users
 * @param userIdA First user ID
 * @param userIdB Second user ID
 */
async function cancelAllPendingRequestsBetweenUsers(userIdA: string, userIdB: string): Promise<void> {
  // Find all pending requests between the two users
  const { data: pendingRequests, error } = await supabase
    .from("connection_requests")
    .select("id, sender_id, receiver_id, status")
    .eq("status", "pending")
    .or(`and(sender_id.eq.${userIdA},receiver_id.eq.${userIdB}),and(sender_id.eq.${userIdB},receiver_id.eq.${userIdA})`);

  if (error) {
    console.error("Error finding pending requests:", error);
    return;
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return;
  }

  // Cancel each pending request
  for (const request of pendingRequests) {
    try {
      await cancelConnectionRequest(request.id, request.sender_id);
    } catch (error) {
      console.error(`Failed to cancel request ${request.id}:`, error);
    }
  }
}

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
    // Handle duplicate key error (user already blocked)
    if (error.code === '23505' && error.message?.includes('blocks_unique')) {
      console.log(`User ${blockedId} is already blocked by ${userId}, continuing...`);
    } else {
      // Some other unexpected database error
      console.error("Unexpected error when blocking user:", error);
      throw error;
    }
  }

  // Auto-decline/cancel any pending requests between the pair.
  try {
    await cancelAllPendingRequestsBetweenUsers(userId, blockedId);
  } catch (error) {
    // Log the error but don't fail the block operation
    console.error("Failed to cancel pending requests during block operation:", error);
  }

  // Remove existing connection if present.
  try {
    await deleteConnection(userId, blockedId);
  } catch (error) {
    // Log the error but don't fail the block operation
    console.error("Failed to remove connection during block operation:", error);
  }
  
  return;
}
/**
 * Unblocks a user
 * Idempotent: deleting a non-existing block still success
 * @param userId The UUID of the currently authenticated user
 * @param blockedId The UUID of the currently blocked user to unblock
 * @returns 
 */
export async function unblockUser(userId: string, blockedId: string): Promise<void> {

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", userId)
    .eq("blocked_id", blockedId);

  if (error) {
    // Some other unexpected database error
    console.error("Unexpected error when unblocking user:", error);
    throw error;
  }

  return;
}