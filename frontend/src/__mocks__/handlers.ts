import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3001/api';

export const handlers = [
  // Login success
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    // Mock successful login
    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        userId: 'user-123',
        accessToken: 'mock-access-token',
        expiresIn: 3600,
      });
    }

    // Mock invalid credentials
    if (email === 'invalid@example.com' || password === 'wrongpassword') {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Mock unverified account
    if (email === 'unverified@example.com') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'ACCOUNT_NOT_VERIFIED',
          message: 'Account not verified',
          details: { resumeToken: 'mock-unverified-token' }
        },
        { status: 403 }
      );
    }

    // Mock rate limit exceeded
    if (email === 'ratelimited@example.com') {
      return HttpResponse.json(
        { code: 'TOO_MANY_ATTEMPTS' },
        { status: 429 }
      );
    }

    return HttpResponse.json(
      { code: 'INVALID_CREDENTIALS' },
      { status: 401 }
    );
  }),

  // Register success
  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, zid } = body;

    // Mock successful registration
    if (email === 'new@example.com' && zid === 'z1234567') {
      return HttpResponse.json({
        success: true,
        userId: 'user-456',
        resumeToken: 'mock-resume-token',
      }, { status: 201 });
    }

    // Mock email already exists
    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { code: 'EMAIL_EXISTS' },
        { status: 409 }
      );
    }

    // Mock zID already exists
    if (zid === 'z9999999') {
      return HttpResponse.json(
        { code: 'ZID_EXISTS' },
        { status: 409 }
      );
    }

    // Mock pending verification exists
    if (email === 'pending@example.com') {
      return HttpResponse.json(
        { code: 'PENDING_VERIFICATION_EXISTS', resumeToken: 'mock-resume-token' },
        { status: 409 }
      );
    }

    // Mock validation error
    if (!email || !zid) {
      return HttpResponse.json(
        { 
          code: 'VALIDATION_ERROR',
          details: { 
            fieldErrors: { 
              email: !email ? ['Email is required'] : [],
              zid: !zid ? ['zID is required'] : []
            }
          }
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      userId: 'user-new',
      resumeToken: 'mock-resume-token',
    }, { status: 201 });
  }),

  // Refresh token
  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      success: true,
      accessToken: 'refreshed-access-token',
      expiresIn: 3600,
    });
  }),

  // Get pending context
  http.get(`${API_BASE_URL}/auth/pending/context`, ({ request }) => {
    const url = new URL(request.url);
    const resumeToken = url.searchParams.get('resumeToken');

    if (resumeToken === 'mock-resume-token') {
      return HttpResponse.json({
        success: true,
        emailMasked: 'n***@example.com',
        resend: {
          cooldownSeconds: 30,
          remainingToday: 5,
        },
      });
    }

    if (resumeToken === 'expired-token') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'RESUME_TOKEN_INVALID',
          message: 'Invalid resume token'
        },
        { status: 401 }
      );
    }

    if (resumeToken === 'verified-token') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'ALREADY_VERIFIED',
          message: 'Account already verified'
        },
        { status: 409 }
      );
    }

    return HttpResponse.json(
      { 
        success: false,
        code: 'PENDING_NOT_FOUND',
        message: 'Pending verification not found'
      },
      { status: 404 }
    );
  }),

  // Verify OTP
  http.post(`${API_BASE_URL}/auth/verify-otp`, async ({ request }) => {
    const body = await request.json() as any;
    const { resumeToken, otp } = body;

    if (resumeToken === 'mock-resume-token' && otp === '123456') {
      return HttpResponse.json({
        success: true,
        message: 'Account verified successfully',
      });
    }

    if (otp === '000000') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'OTP_INVALID',
          message: 'Invalid OTP'
        },
        { status: 400 }
      );
    }

    if (otp === '999999') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'OTP_EXPIRED',
          message: 'OTP has expired'
        },
        { status: 400 }
      );
    }

    if (otp === '888888') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'OTP_LOCKED',
          message: 'Too many attempts'
        },
        { status: 429 }
      );
    }

    return HttpResponse.json(
      { 
        success: false,
        code: 'OTP_INVALID',
        message: 'Invalid OTP'
      },
      { status: 400 }
    );
  }),

  // Resend OTP
  http.post(`${API_BASE_URL}/auth/resend-otp`, async ({ request }) => {
    const body = await request.json() as any;
    const { resumeToken } = body;

    if (resumeToken === 'mock-resume-token') {
      return HttpResponse.json({
        success: true,
        message: 'Verification code sent',
        resend: {
          cooldownSeconds: 60,
          remainingToday: 4,
        },
      });
    }

    if (resumeToken === 'cooldown-token') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'OTP_COOLDOWN',
          message: 'Please wait before requesting another code'
        },
        { status: 429 }
      );
    }

    if (resumeToken === 'limit-reached-token') {
      return HttpResponse.json(
        { 
          success: false,
          code: 'OTP_RESEND_LIMIT',
          message: 'Daily resend limit reached'
        },
        { status: 429 }
      );
    }

    return HttpResponse.json(
      { 
        success: false,
        code: 'RESUME_TOKEN_INVALID',
        message: 'Invalid resume token'
      },
      { status: 401 }
    );
  }),
];

// Handlers for network errors
export const networkErrorHandlers = [
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.error();
  }),
  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.error();
  }),
];