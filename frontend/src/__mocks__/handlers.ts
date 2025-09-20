import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3001/api';

// Mock profile data - matches ProfileMe schema
const mockProfile = {
  id: 'profile-123',
  fullName: 'John Doe',
  handle: 'john.doe',
  photoUrl: null,
  isIndonesian: true,
  program: 'Computer Science',
  major: 'Software Engineering',
  level: 'undergrad',
  yearStart: 2022,
  yearGrad: null,
  zid: 'z1234567',
  headline: null,
  domicileCity: null,
  domicileCountry: null,
  bio: 'Computer Science student passionate about technology and innovation.',
  socialLinks: {},
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  experience: [
    {
      id: 'exp-1',
      title: 'Software Engineering Intern',
      company: 'Tech Corp',
      description: 'Worked on developing web applications using React and Node.js.',
      start_date: '2023-06-01T00:00:00Z',
      end_date: '2023-08-31T00:00:00Z',
      is_current: false,
    },
    {
      id: 'exp-2',
      title: 'Frontend Developer',
      company: 'Startup Inc',
      description: 'Currently working on building user interfaces for mobile applications.',
      start_date: '2023-09-01T00:00:00Z',
      end_date: null,
      is_current: true,
    },
  ],
  skills: [
    { id: 'skill-1', name: 'React', category: 'Framework' },
    { id: 'skill-2', name: 'TypeScript', category: 'Programming' },
    { id: 'skill-3', name: 'Node.js', category: 'Technical' },
  ],
};

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
        emailMasked: 'n***@example.com',
        status: 'PENDING_VERIFICATION',
        resend: {
          cooldownSeconds: 0,
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

  // Profile endpoints
  http.get(`${API_BASE_URL}/profile/me`, () => {
    return HttpResponse.json(mockProfile);
  }),

  http.get(`${API_BASE_URL}/profile/:handle`, ({ params }) => {
    const { handle } = params;
    
    if (handle === 'john.doe') {
      return HttpResponse.json({
        success: true,
        profile: mockProfile,
      });
    }
    
    if (handle === 'nonexistent') {
      return HttpResponse.json(
        { code: 'PROFILE_NOT_FOUND', message: 'Profile not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      profile: { ...mockProfile, handle: handle as string },
    });
  }),

  http.get(`${API_BASE_URL}/handle/check`, ({ request }) => {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle');
    
    const takenHandles = ['admin', 'test', 'john.doe', 'taken'];
    const available = handle ? !takenHandles.includes(handle) : false;
    
    return HttpResponse.json({
      success: true,
      available,
    });
  }),

  http.patch(`${API_BASE_URL}/profile/handle`, async ({ request }) => {
    const body = await request.json() as any;
    const { handle } = body;

    const takenHandles = ['admin', 'test', 'taken'];
    
    if (takenHandles.includes(handle)) {
      return HttpResponse.json(
        { code: 'HANDLE_TAKEN', message: 'Handle already taken' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      message: 'Handle updated successfully',
    });
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