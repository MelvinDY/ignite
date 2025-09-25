import { supabase } from "../lib/supabase";
import {
  ConnectionRequest,
  CancelResult,
  ConnectionRequestError,
  IncomingConnectionRequestList,
  IncomingConnectionRequestQueryData,
  OutgoingConnectionRequestList,
  OutgoingConnectionRequestQueryData,
} from "../types/ConnectionRequest";

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
