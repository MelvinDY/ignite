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

export interface DeleteConnectionResult {
  success: boolean;
  wasConnected?: boolean;
}

export interface IncomingConnectionRequest {
  id: string;
  fromUser: {
    profileId: string;
    fullName: string;
    handle: string;
    avatar_url: string | null;
  }
  created_at: string;
}

export interface OutgoingConnectionRequest {
  id: string;
  toUser: {
    profileId: string;
    fullName: string;
    handle: string;
    avatar_url: string | null;
  }
  created_at: string;
}

export interface ConnectionRequestPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IncomingConnectionRequestList {
  results: IncomingConnectionRequest[] | [];
  pagination: ConnectionRequestPagination;
}

export interface OutgoingConnectionRequestList {
  results: OutgoingConnectionRequest[] | [];
  pagination: ConnectionRequestPagination;
}

export interface IncomingConnectionRequestQueryData {
  id: string; 
  sender_id: string; 
  receiver_id: string;
  sender: { 
    full_name: string; 
    handle: string; 
    avatar_url: string | null; 
  }[];
  created_at: string;
}

export interface OutgoingConnectionRequestQueryData {
  id: string; 
  sender_id: string; 
  receiver_id: string;
  receiver: { 
    full_name: string; 
    handle: string; 
    avatar_url: string | null; 
  }[];
  created_at: string;
}
