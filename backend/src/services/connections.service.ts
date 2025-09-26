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

/**
 * Represents the relationship status between two users
 */
export type RelationshipStatus = {
  connected: boolean;
  pendingOutgoing: boolean;
  pendingIncoming: boolean;
  blockedByMe: boolean;
  blockedMe: boolean;
  canSendRequest: boolean;
};

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
    .eq("receiver_id", userId);

  if (countError) {
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const { data: connectionRequestsData, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      created_at,
      sender:profiles!sender_id(full_name, avatar_url, handle)
    `
    )
    .eq("receiver_id", userId)
    .range(startIndex, endIndex)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch connection requests: ${error.message}`);
  }

  const ret =
    connectionRequestsData.map((row: IncomingConnectionRequestQueryData) => ({
      id: row.id,
      fromUser: {
        profileId: row.sender_id,
        fullName: row.sender[0].full_name,
        handle: row.sender[0].handle,
        avatar_url: row.sender[0].avatar_url,
      },
      created_at: row.created_at,
    })) || [];

  return {
    results: ret,
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
    .eq("receiver_id", userId);

  if (countError) {
    throw new Error(`Failed to get count: ${countError.message}`);
  }

  const { data: connectionRequestsData, error } = await supabase
    .from("connection_requests")
    .select(
      `
      id,
      sender_id,
      receiver_id,
      created_at,
      receiver:profiles!receiver_id(full_name, avatar_url, handle)
    `
    )
    .eq("sender_id", userId)
    .range(startIndex, endIndex)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch connection requests: ${error.message}`);
  }

  const ret =
    connectionRequestsData.map((row: OutgoingConnectionRequestQueryData) => ({
      id: row.id,
      toUser: {
        profileId: row.receiver_id,
        fullName: row.receiver[0].full_name,
        handle: row.receiver[0].handle,
        avatar_url: row.receiver[0].avatar_url,
      },
      created_at: row.created_at,
    })) || [];

  return {
    results: ret,
    pagination: {
      total: totalCount || 0,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil((totalCount || 0) / pageSize),
    },
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
