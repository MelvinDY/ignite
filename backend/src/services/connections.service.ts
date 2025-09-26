import { supabase } from "../lib/supabase";

// ==== ENV knobs (soft caps / cooldowns) ====
const DAILY_SEND_CAP = Number(process.env.CR_DAILY_SEND_CAP ?? 20);
const DECLINE_COOLDOWN_MIN = Number(process.env.CR_PAIR_COOLDOWN_MIN ?? 10);

/**
 * Represents a connection request with basic information
 */
export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'canceled';
  message?: string;
  created_at: string;
  updated_at: string;
  acted_at?: string;
}

/**
 * Result of a cancel operation
 */
export interface CancelResult {
  success: boolean;
  alreadyCanceled?: boolean;
}

/**
 * Result of a delete connection operation
 */
export interface DeleteConnectionResult {
  success: boolean;
  wasConnected?: boolean;
}

/**
 * Custom error for connection request operations
 */
export class ConnectionRequestError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_FOUND'
      | 'INVALID_STATE'
      | 'UNAUTHORIZED'
      | 'ALREADY_CONNECTED'
      | 'REQUEST_ALREADY_EXISTS'
      | 'BLOCKED'
      | 'TOO_MANY_REQUESTS',
    public statusCode: number
  ) {
    super(message);
    this.name = 'ConnectionRequestError';
  }
}

// --- Types for the new flow ---
type SendArgs = {
  senderId: string;
  receiverId: string;
  message: string | null;
};

export interface SendConnectionResult {
  requestId: string;
}

// --- Helpers ---
function normalizePair(a: string, b: string) {
  return a < b ? [a, b] as const : [b, a] as const;
}

async function assertTargetExistsAndNotSelf(senderId: string, receiverId: string) {
  if (senderId === receiverId) {
    throw new ConnectionRequestError("Cannot send to self", "INVALID_STATE", 400);
  }
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", receiverId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ConnectionRequestError("User not found", "NOT_FOUND", 404);
}

async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id")
    .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
    .limit(1);
  if (error) throw error;
  return !!data?.length;
}


async function alreadyConnected(a: string, b: string): Promise<boolean> {
  const [x, y] = normalizePair(a, b);
  const { data, error } = await supabase
    .from("connections")
    .select("user_id_a")
    .eq("user_id_a", x)
    .eq("user_id_b", y)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function pendingExistsEitherWay(a: string, b: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("status", "pending")
    .or(`and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`)
    .limit(1);
  if (error) throw error;
  return !!data?.length;
}

async function pairDeclineCooldownActive(senderId: string, receiverId: string): Promise<boolean> {
  // Has this sender been declined by this receiver recently?
  const { data, error } = await supabase
    .from("connection_requests")
    .select("acted_at")
    .eq("status", "declined")
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .order("acted_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data?.length || !data[0].acted_at) return false;

  const lastDeclinedAt = new Date(data[0].acted_at);
  const diffMin = (Date.now() - lastDeclinedAt.getTime()) / 60000;
  return diffMin < DECLINE_COOLDOWN_MIN;
}

async function overDailyCap(senderId: string): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("count_recent_connection_requests", {
    p_sender_id: senderId,
    p_since: since,
  });
  if (error) throw error;
  return Number(data ?? 0) >= DAILY_SEND_CAP;
}

async function insertPendingRequest(args: SendArgs): Promise<string> {
  const { data, error } = await supabase
    .from("connection_requests")
    .insert({
      sender_id: args.senderId,
      receiver_id: args.receiverId,
      message: args.message,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function emitNotificationConnectionRequest(receiverId: string, actorId: string) {
  // Adjust type if your enum differs
  await supabase.from("notifications").insert({
    user_id: receiverId,
    type: "connection_request",
    data: { actorId },
  });
}

// --- Main: Send connection request ---
export async function sendConnectionRequest(args: SendArgs): Promise<SendConnectionResult> {
  // 1) basic checks
  await assertTargetExistsAndNotSelf(args.senderId, args.receiverId);

  // 2) blocked?
  if (await isBlockedEitherWay(args.senderId, args.receiverId)) {
    throw new ConnectionRequestError("User is blocked", "BLOCKED", 403);
  }

  // 3) already connected?
  if (await alreadyConnected(args.senderId, args.receiverId)) {
    throw new ConnectionRequestError("Already connected", "ALREADY_CONNECTED", 409);
  }

  // 4) pending exists either way?
  if (await pendingExistsEitherWay(args.senderId, args.receiverId)) {
    throw new ConnectionRequestError("Request already exists", "REQUEST_ALREADY_EXISTS", 409);
  }

  // 5) pair cooldown after decline?
  if (await pairDeclineCooldownActive(args.senderId, args.receiverId)) {
    throw new ConnectionRequestError("Request already exists (cooldown)", "REQUEST_ALREADY_EXISTS", 409);
  }

  // 6) daily cap?
  if (await overDailyCap(args.senderId)) {
    throw new ConnectionRequestError("Too many requests today", "TOO_MANY_REQUESTS", 429);
  }

  // 7) create + notify
  const requestId = await insertPendingRequest(args);
  await emitNotificationConnectionRequest(args.receiverId, args.senderId);

  return { requestId };
}

/**
 * Get a connection request by ID
 * @param requestId The UUID of the connection request
 * @returns The connection request or null if not found
 */
export async function getConnectionRequest(requestId: string): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from("connection_requests")
    .select("id, sender_id, receiver_id, status, message, created_at, updated_at, acted_at")
    .eq("id", requestId)
    .single();

  if (error || !data) {
    console.log("Connection request not found:", { requestId, error: error?.message });
    return null;
  }

  return data as ConnectionRequest;
}

/**
 * Cancel a pending connection request
 * @param requestId The UUID of the connection request to cancel
 * @param userId The UUID of the user attempting to cancel (must be the sender)
 * @returns Result indicating success and whether it was already canceled
 */
export async function cancelConnectionRequest(requestId: string, userId: string): Promise<CancelResult> {
  // 1. Get the connection request
  const connectionRequest = await getConnectionRequest(requestId);
  console.log("Found connection request:", connectionRequest);

  if (!connectionRequest) {
    console.log("Connection request not found, throwing error");
    throw new ConnectionRequestError("Connection request not found", "NOT_FOUND", 404);
  }

  // 2. Verify the caller is the sender
  if (connectionRequest.sender_id !== userId) {
    throw new ConnectionRequestError("Connection request not found", "NOT_FOUND", 404);
  }

  // 3. Check if the request is in a valid state to be canceled
  if (connectionRequest.status !== "pending") {
    // If already canceled, return success (idempotent)
    if (connectionRequest.status === "canceled") {
      return { success: true, alreadyCanceled: true };
    }
    // If accepted or declined, can't cancel
    throw new ConnectionRequestError(
      "Connection request cannot be canceled in its current state",
      "INVALID_STATE",
      409
    );
  }

  // 4. Update the request status to canceled
  const { error: updateError } = await supabase
    .from("connection_requests")
    .update({
      status: "canceled",
      acted_at: new Date().toISOString()
    })
    .eq("id", requestId);

  if (updateError) {
    throw updateError;
  }

  return { success: true };
}

/**
 * Delete a connection between two users
 * @param currentUserId The UUID of the currently authenticated user
 * @param targetProfileId The UUID of the profile to disconnect from
 * @returns Result indicating success and whether they were previously connected
 */
export async function deleteConnection(currentUserId: string, targetProfileId: string): Promise<DeleteConnectionResult> {
  // The connections table stores undirected relationships, so we need to check both combinations
  // We use LEAST/GREATEST to ensure consistent ordering as per the unique index
  const { data, error } = await supabase
    .from("connections")
    .delete()
    .or(`and(user_id_a.eq.${currentUserId},user_id_b.eq.${targetProfileId}),and(user_id_a.eq.${targetProfileId},user_id_b.eq.${currentUserId})`)
    .select();

  if (error) {
    console.error("Error deleting connection:", error);
    throw error;
  }

  // Return success regardless of whether a connection existed (idempotent)
  // data will be an array - if empty, no connection existed
  const wasConnected = data && data.length > 0;

  console.log("Connection deletion result:", {
    currentUserId,
    targetProfileId,
    wasConnected,
    deletedRows: data?.length || 0
  });

  return {
    success: true,
    wasConnected
  };
}