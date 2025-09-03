import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:5000/api';

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
        { code: 'ACCOUNT_NOT_VERIFIED' },
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