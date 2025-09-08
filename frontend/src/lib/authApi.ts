import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Error Response Schema
const ErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  code: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
});

// Login
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LoginResponseSchema = z.object({
  success: z.literal(true),
  accessToken: z.string(),
  userId: z.string(),
  expiresIn: z.number(),
});

// Register
const RegisterRequestSchema = z.object({
  fullName: z.string().min(1),
  zid: z.string().regex(/^z[0-9]{7}$/),
  isIndonesian: z.boolean(),
  yearIntake: z.number().int().min(1900),
  level: z.string().min(1),
  program: z.string().min(1),
  major: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

const RegisterResponseSchema = z.object({
  success: z.literal(true),
  userId: z.string(),
  resumeToken: z.string(),
});

// Refresh
const RefreshResponseSchema = z.object({
  success: z.literal(true),
  accessToken: z.string(),
  expiresIn: z.number(),
});


// Verify OTP
const VerifyOtpRequestSchema = z.object({
  resumeToken: z.string(),
  otp: z.string().length(6),
});

const VerifyOtpResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

// Resend OTP
const ResendOtpRequestSchema = z.object({
  resumeToken: z.string(),
});

const ResendOtpResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  resend: z.object({
    cooldownSeconds: z.number(),
    remainingToday: z.number(),
  }),
});

// Types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LoginErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type RegisterErrorResponse = z.infer<typeof ErrorResponseSchema>;

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;


export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>;
export type VerifyOtpResponse = z.infer<typeof VerifyOtpResponseSchema>;

export type ResendOtpRequest = z.infer<typeof ResendOtpRequestSchema>;
export type ResendOtpResponse = z.infer<typeof ResendOtpResponseSchema>;

// Error types for discriminated unions
export type AuthError = {
  success: false;
  code: 'VALIDATION_ERROR' | 'EMAIL_EXISTS' | 'ZID_EXISTS' | 'PENDING_VERIFICATION_EXISTS' | 
        'RESUME_TOKEN_INVALID' | 'PENDING_NOT_FOUND' | 'ALREADY_VERIFIED' | 'OTP_INVALID' | 
        'OTP_EXPIRED' | 'OTP_LOCKED' | 'OTP_COOLDOWN' | 'OTP_RESEND_LIMIT' | 'INVALID_CREDENTIALS' | 
        'ACCOUNT_NOT_VERIFIED' | 'TOO_MANY_ATTEMPTS' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
};

export class AuthApiError extends Error {
  public readonly code: AuthError['code'];
  public readonly status: number;
  public readonly details?: any;

  constructor(
    code: AuthError['code'],
    status: number,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class AuthApi {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    responseSchema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      credentials: 'include', // Important for refresh cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new AuthApiError('NETWORK_ERROR', response.status, 'Invalid JSON response');
      }

      if (!response.ok) {
        const errorResult = ErrorResponseSchema.safeParse(data);
        if (errorResult.success) {
          throw new AuthApiError(
            errorResult.data.code as AuthError['code'],
            response.status,
            errorResult.data.message || `Error: ${errorResult.data.code}`,
            errorResult.data.details
          );
        }
        throw new AuthApiError('UNKNOWN_ERROR', response.status, 'Unknown error occurred');
      }

      if (responseSchema) {
        const result = responseSchema.safeParse(data);
        if (!result.success) {
          console.error('Response validation failed:', result.error);
          throw new AuthApiError('UNKNOWN_ERROR', 200, 'Invalid response format');
        }
        return result.data;
      }

      return data;
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }
      
      // Network or other errors
      throw new AuthApiError('NETWORK_ERROR', 0, 'Unable to connect to server');
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, RegisterResponseSchema);
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, LoginResponseSchema);
  }

  async refresh(): Promise<RefreshResponse> {
    return this.request('/auth/refresh', {
      method: 'POST',
    }, RefreshResponseSchema);
  }


  async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(request),
    }, VerifyOtpResponseSchema);
  }

  async resendOtp(request: ResendOtpRequest): Promise<ResendOtpResponse> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(request),
    }, ResendOtpResponseSchema);
  }
}

export const authApi = new AuthApi();