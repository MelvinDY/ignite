import { supabase } from "../lib/supabase";
import {
  ConnectionRequest,
  CancelResult,
  ConnectionRequestError,
  IncomingConnectionRequestList,
  IncomingConnectionRequestQueryData,
  OutgoingConnectionRequestList,
  OutgoingConnectionRequestQueryData,
  DeleteConnectionResult
} from "../types/ConnectionRequest";

// ==== ENV knobs (soft caps / cooldowns) ====
const DAILY_SEND_CAP = Number(process.env.CR_DAILY_SEND_CAP ?? 20);
const DECLINE_COOLDOWN_MIN = Number(process.env.CR_PAIR_COOLDOWN_MIN ?? 10);

/**
 * Connection profile information for listing
 */
export interface ConnectionProfile {
  profileId: string;
  fullName: string;
  handle: string | null;
  photoUrl: string | null;
  headline: string | null;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Result of getting connections list
 */
export interface GetConnectionsResult {
  results: ConnectionProfile[];
  pagination: PaginationInfo;
}

export type RelationshipStatus = {
  connected: boolean;
  pendingOutgoing: boolean;
  pendingIncoming: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
  canSendRequest: boolean;
};

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
export async function getConnectionRequest(
  requestId: string
): Promise<ConnectionRequest | null> {
  const { data, error } = await supabase
    .from("connection_requests")
    .select(
      "id, sender_id, receiver_id, status, message, created_at, updated_at, acted_at"
    )
    .eq("id", requestId)
    .single();

  if (error || !data) {
    console.log("Connection request not found:", {
      requestId,
      error: error?.message,
    });
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
export async function cancelConnectionRequest(
  requestId: string,
  userId: string
): Promise<CancelResult> {
  // 1. Get the connection request
  const connectionRequest = await getConnectionRequest(requestId);
  console.log("Found connection request:", connectionRequest);

  if (!connectionRequest) {
    console.log("Connection request not found, throwing error");
    throw new ConnectionRequestError(
      "Connection request not found",
      "NOT_FOUND",
      404
    );
  }

  // 2. Verify the caller is the sender
  if (connectionRequest.sender_id !== userId) {
    throw new ConnectionRequestError(
      "Connection request not found",
      "NOT_FOUND",
      404
    );
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
      acted_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    throw updateError;
  }

  return { success: true };
}

// helper (optional, keeps the mapper tidy)
const safe = <T extends object>(o: T | null | undefined) => o ?? ({} as any);

export async function listIncomingConnectionRequest(
  userId: string,
  page: number,
  pageSize: number
): Promise<IncomingConnectionRequestList> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;

  const { count: totalCount, error: countError } = await supabase
    .from("connection_requests")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (countError) {
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const { data, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      message,
      created_at,
      status,
      sender:profiles!connection_requests_sender_id_fkey(
        id, full_name, handle, photo_url
      )
    `
    )
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .range(startIndex, endIndex)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch connection requests: ${error.message}`);
  }

  const results =
    (data ?? []).map((row: any) => {
      const sender = safe(row.sender);
      return {
        id: row.id,
        message: row.message ?? null,
        fromUser: {
          profileId: row.sender_id,
          fullName: sender.full_name ?? null,
          handle: sender.handle ?? null,
          photo_url: sender.photo_url ?? null,
        },
        created_at: row.created_at,
      };
    });

  return {
    results,
    pagination: {
      total: totalCount || 0,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    },
  };
}

export async function listOutgoingConnectionRequest(
  userId: string,
  page: number,
  pageSize: number
): Promise<OutgoingConnectionRequestList> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize - 1;

  const { count: totalCount, error: countError } = await supabase
    .from("connection_requests")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", userId)
    .eq("status", "pending");

  if (countError) {
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const { data, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      message,
      created_at,
      status,
      receiver:profiles!connection_requests_receiver_id_fkey(
        id, full_name, handle, photo_url
      )
    `
    )
    .eq("sender_id", userId)
    .eq("status", "pending")
    .range(startIndex, endIndex)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch connection requests: ${error.message}`);
  }

  const results =
    (data ?? []).map((row: any) => {
      const receiver = safe(row.receiver);
      return {
        id: row.id,
        message: row.message ?? null,
        toUser: {
          profileId: row.receiver_id,
          fullName: receiver.full_name ?? null,
          handle: receiver.handle ?? null,
          photo_url: receiver.photo_url ?? null,
        },
        created_at: row.created_at,
      };
    });

  return {
    results,
    pagination: {
      total: totalCount || 0,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    },
  };
}
/**
 * Get paginated connections for a user
 * @param userId The UUID of the user whose connections to fetch
 * @param page Page number (1-based)
 * @param pageSize Number of connections per page
 * @returns Paginated list of connections with profile information
 */
export async function getConnections(userId: string, page: number = 1, pageSize: number = 20): Promise<GetConnectionsResult> {
  // Validate pagination parameters
  const validPage = Math.max(1, page);
  const validPageSize = Math.min(Math.max(1, pageSize), 100); // Cap at 100
  const offset = (validPage - 1) * validPageSize;

  // Get total count of connections for this user
  const { count, error: countError } = await supabase
    .from("connections")
    .select("*", { count: "exact", head: true })
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);

  if (countError) {
    console.error("Error counting connections:", countError);
    throw countError;
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / validPageSize);

  // If no connections, return empty result
  if (total === 0) {
    return {
      results: [],
      pagination: {
        total: 0,
        page: validPage,
        pageSize: validPageSize,
        totalPages: 0
      }
    };
  }

  // Get connections with profile data
  // We need to handle the fact that the user could be in either user_id_a or user_id_b
  const { data: connections, error } = await supabase
    .from("connections")
    .select(`
      connected_at,
      user_id_a,
      user_id_b,
      profile_a:profiles!connections_user_id_a_fkey(id, full_name, handle, photo_url, headline),
      profile_b:profiles!connections_user_id_b_fkey(id, full_name, handle, photo_url, headline)
    `)
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`)
    .order("connected_at", { ascending: false })
    .range(offset, offset + validPageSize - 1);

  if (error) {
    console.error("Error fetching connections:", error);
    throw error;
  }

  // Transform the data to get the "other" user's profile for each connection
  const results: ConnectionProfile[] = (connections || []).map((conn: any) => {
    // Determine which profile is the "other" user (not the requesting user)
    const isUserA = conn.user_id_a === userId;
    const otherProfile = isUserA ? conn.profile_b : conn.profile_a;

    return {
      profileId: otherProfile.id,
      fullName: otherProfile.full_name,
      handle: otherProfile.handle,
      photoUrl: otherProfile.photo_url,
      headline: otherProfile.headline
    };
  });

  console.log("Connections fetched:", {
    userId,
    page: validPage,
    pageSize: validPageSize,
    total,
    resultCount: results.length
  });

  return {
    results,
    pagination: {
      total,
      page: validPage,
      pageSize: validPageSize,
      totalPages
    }
  };
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

/**
 * Resolve the relationship status between two profiles.
 * Order of checks: blocks → connection → pending (both ways) → ability to send
 * @param currentUserId The UUID of the currently authenticated user
 * @param withProfileId The UUID of the profile to check the relationship with
 * @returns The relationship status object
 */
export async function getRelationshipStatus(
  currentUserId: string,
  withProfileId: string
): Promise<RelationshipStatus> {
  // 0) Target must exist
  const { data: target, error: targetErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", withProfileId)
    .maybeSingle();

  if (targetErr) throw targetErr;
  if (!target) {
    const e: any = new Error("NOT_FOUND");
    e.code = "NOT_FOUND";
    throw e;
  }

  // 1) Blocks (directed)
  const { data: blockOut } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", currentUserId)
    .eq("blocked_id", withProfileId)
    .maybeSingle();

  const { data: blockIn } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", withProfileId)
    .eq("blocked_id", currentUserId)
    .maybeSingle();

  const blockedByMe = !!blockOut;
  const blockedMe = !!blockIn;

  if (blockedByMe || blockedMe) {
    return {
      connected: false,
      pendingOutgoing: false,
      pendingIncoming: false,
      blockedByMe,
      blockedMe,
      canSendRequest: false,
    };
  }

  // 2) Connection (undirected)
  const { data: conn } = await supabase
    .from("connections")
    .select("user_id_a")
    .or(
      `and(user_id_a.eq.${currentUserId},user_id_b.eq.${withProfileId}),and(user_id_a.eq.${withProfileId},user_id_b.eq.${currentUserId})`
    )
    .maybeSingle();

  const connected = !!conn;
  if (connected) {
    return {
      connected: true,
      pendingOutgoing: false,
      pendingIncoming: false,
      blockedByMe: false,
      blockedMe: false,
      canSendRequest: false,
    };
  }

  // 3) Pending requests (both directions)
  const { data: outReq } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("sender_id", currentUserId)
    .eq("receiver_id", withProfileId)
    .eq("status", "pending")
    .maybeSingle();

  const { data: inReq } = await supabase
    .from("connection_requests")
    .select("id")
    .eq("sender_id", withProfileId)
    .eq("receiver_id", currentUserId)
    .eq("status", "pending")
    .maybeSingle();

  const pendingOutgoing = !!outReq;
  const pendingIncoming = !!inReq;

  // 4) Ability to send request
  const canSendRequest =
    !blockedByMe &&
    !blockedMe &&
    !connected &&
    !pendingOutgoing &&
    !pendingIncoming &&
    currentUserId !== withProfileId;

  return {
    connected: false,
    pendingOutgoing,
    pendingIncoming,
    blockedByMe: false,
    blockedMe: false,
    canSendRequest,
  };
}
