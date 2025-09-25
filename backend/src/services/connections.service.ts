import { supabase } from "../lib/supabase";

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
    public code: 'NOT_FOUND' | 'INVALID_STATE' | 'UNAUTHORIZED',
    public statusCode: number
  ) {
    super(message);
    this.name = 'ConnectionRequestError';
  }
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