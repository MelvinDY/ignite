// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: true;
  userId: string;
  accessToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  fullName: string;
  zid: string;
  yearIntake: number;
  level: string;
  isIndonesian: boolean;
  program: string;
  major: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponse {
  success: true;
  userId: string;
  resumeToken: string;
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(`API Error: ${code}`);
    this.name = 'ApiError';
  }
}



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.code || 'UNKNOWN_ERROR', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiError('NETWORK_ERROR', 0, { 
        message: 'Unable to connect to server. Please try again.' 
      });
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}


export const apiClient = new ApiClient();