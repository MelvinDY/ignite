// src/lib/api/connections.ts
import { authStateManager } from "../../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export type Direction = "incoming" | "outgoing";

export interface MiniProfile {
  id: string;
  fullName: string;
  handle: string;
  photoUrl?: string | null;
  headline?: string | null;
  domicileCity?: string | null;
  domicileCountry?: string | null;
}

export interface ConnectionRequest {
  requestId: string;
  fromProfile: MiniProfile;
  toProfile: MiniProfile;
  status: "pending" | "accepted" | "declined" | "canceled";
  createdAt: string; // ISO
  message?: string | null;
}

export interface RequestsResponse {
  results: ConnectionRequest[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ConnectionsListResponse {
  results: MiniProfile[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export class ConnectionsApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = "ConnectionsApiError";
  }
}

/** === Auth + Error helpers (match searchApi style) === */
const getAuthHeaders = () => {
  const authState = authStateManager.getState?.();
  const token = authState?.accessToken;
  if (!token) {
    throw new ConnectionsApiError("No access token found", "NOT_AUTHENTICATED", 401);
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  } as const;
};

const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      throw new ConnectionsApiError(
        `HTTP ${response.status}`,
        "HTTP_ERROR",
        response.status
      );
    }
    // Normalize 401s to a consistent code/message
    if (response.status === 401) {
      throw new ConnectionsApiError(
        errorData?.message || "Please log in to continue.",
        "NOT_AUTHENTICATED",
        401
      );
    }
    throw new ConnectionsApiError(
      errorData?.message || `HTTP ${response.status}`,
      errorData?.code || "HTTP_ERROR",
      response.status
    );
  }
  return response;
};

/** Helpers to normalize backend shapes → frontend shapes */
const mapUserToMini = (u: any): MiniProfile => ({
  id: u?.profileId ?? "",
  fullName: u?.fullName ?? "",
  handle: u?.handle ?? "",
  photoUrl: u?.photo_url ?? null,
  // headline/city/country are optional; leave undefined unless backend provides them
});

const mapRequest = (raw: any, listType: Direction): ConnectionRequest => {
  // Backend samples show: { id, message, toUser, fromUser?, created_at }
  // We guarantee both fromProfile and toProfile so UI never hits undefined.
  const hasFrom = !!raw?.fromUser;
  const hasTo = !!raw?.toUser;

  // Prefer backend user objects; fallback to empty MiniProfile to avoid undefined
  const fromProfile = hasFrom ? mapUserToMini(raw.fromUser) : { id: "", fullName: "", handle: "" };
  const toProfile = hasTo ? mapUserToMini(raw.toUser) : { id: "", fullName: "", handle: "" };

  return {
    requestId: String(raw?.id ?? ""),
    status: (raw?.status as ConnectionRequest["status"]) || "pending",
    createdAt: raw?.created_at || new Date().toISOString(),
    message: raw?.message ?? null,
    fromProfile,
    toProfile,
  };
};

/** Map a connection item (shape from GET /connections)*/
const mapConnectionMini = (u: any): MiniProfile => ({
  id: u?.profileId ?? u?.id ?? "",
  fullName: u?.fullName ?? "",
  handle: u?.handle ?? "",
  photoUrl: u?.photoUrl ?? u?.photo_url ?? null,
  headline: u?.headline ?? null,
  domicileCity: u?.domicileCity ?? null,
  domicileCountry: u?.domicileCountry ?? null,
});

/** === API surface === */
export const connectionsApi = {
  /** Send Connection Request (POST /connections/requests) */
  async sendRequest(
    toProfileId: string,
    message?: string
  ): Promise<{ requestId: string; status: "pending"; success: true }> {
    const res = await fetch(`${API_BASE}/connections/requests`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ toProfileId, message }),
    });
    await handleApiError(res);
    return res.json();
  },

  /** List Connection Requests (GET /connections/requests?type=...) */
  async listRequests(
    type: Direction,
    page = 1,
    pageSize = 20
  ): Promise<RequestsResponse> {
    const params = new URLSearchParams({
      type,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`${API_BASE}/connections/requests?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(res);
    const raw = await res.json();

    // Normalize results
    const mapped: ConnectionRequest[] = Array.isArray(raw?.results)
      ? raw.results.map((r: any) => mapRequest(r, type))
      : [];

    // Ensure keys exist & avoid React key warning
    // (Your UI uses requestId as key)
    return {
      results: mapped,
      pagination: raw?.pagination ?? {
        total: mapped.length,
        page,
        pageSize,
        totalPages: 1,
      },
    };
  },

  /** Cancel a pending request (POST /connections/requests/:id/cancel) */
  async cancel(requestId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/connections/requests/${encodeURIComponent(requestId)}/cancel`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );
    await handleApiError(res);
  },

  /** Accept incoming (keep commented until your route is live) */
  async accept(requestId: string): Promise<void> {
    const res = await fetch(
      `${API_BASE}/connections/requests/${encodeURIComponent(requestId)}/accept`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );
    await handleApiError(res);
  },

  /** Decline incoming (keep commented until your route is live) */
  // async decline(requestId: string): Promise<void> {
  //   const res = await fetch(
  //     `${API_BASE}/connections/requests/${encodeURIComponent(requestId)}/decline`,
  //     {
  //       method: "POST",
  //       headers: getAuthHeaders(),
  //       credentials: "include",
  //     }
  //   );
  //   await handleApiError(res);
  // },

  /** List existing connections (GET /connections) */
  async listConnections(page = 1, pageSize = 20): Promise<ConnectionsListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`${API_BASE}/connections?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(res);
    const raw = await res.json();

    // Normalize so each connection has a proper MiniProfile.id
    const results: MiniProfile[] = Array.isArray(raw?.results)
      ? raw.results.map((u: any) => mapConnectionMini(u))
      : [];

    return {
      results,
      pagination: raw?.pagination ?? {
        total: results.length,
        page,
        pageSize,
        totalPages: 1,
      },
    };
  },

  /** Remove a connection (DELETE /connections/:profileId) */
  async removeConnection(profileId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/connections/${encodeURIComponent(profileId)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(res);
  },

  /** Relationship status (GET /connections/status?withProfileId=...) */
  async getStatus(withProfileId: string): Promise<{
    connected: boolean;
    pendingOutgoing: boolean;
    pendingIncoming: boolean;
    blockedByMe: boolean;
    blockedMe: boolean;
    canSendRequest: boolean;
  }> {
    const params = new URLSearchParams({ withProfileId });
    const res = await fetch(`${API_BASE}/connections/status?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    await handleApiError(res);
    return res.json();
  },
};
