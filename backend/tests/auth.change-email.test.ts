import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// ---- shared mutable "scenario" used by mocks ----
type UserSignupRow = {
  id: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED';
  signup_email: string;
  full_name: string;
};

type ProfileRow = {
  id: string;
  email: string;
};

const scenario = {
  // what the route sees when looking up user
  userSignup: null as UserSignupRow | null,
  // what the route sees when checking if email exists in profiles
  existingProfile: null as ProfileRow | null,
  // instrumentation flags
  emailUpdated: false,
  otpIssued: false,
  tokenInvalidated: false,
  otpCleared: false,
  newResumeTokenCreated: false,
};

// rebuild app with fresh mocks every test
async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // default scenario: valid pending user, no email conflicts
  scenario.userSignup = {
    id: 'user-123',
    status: 'PENDING_VERIFICATION',
    signup_email: 'old@gmail.com',
    full_name: 'Test User',
  };
  scenario.existingProfile = null; // no email conflict by default
  scenario.emailUpdated = false;
  scenario.otpIssued = false;
  scenario.tokenInvalidated = false;
  scenario.otpCleared = false;
  scenario.newResumeTokenCreated = false;

  // ---- mock supabase ----
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => ({ 
                  data: scenario.existingProfile, 
                  error: null 
                })
              })
            })
          };
        }
        if (table === 'user_signups') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => ({ 
                  data: scenario.userSignup, 
                  error: null 
                })
              })
            }),
            update: (updates: any) => {
              // track email updates
              if (updates.signup_email) {
                scenario.emailUpdated = true;
                if (scenario.userSignup) {
                  scenario.userSignup.signup_email = updates.signup_email;
                }
              }
              // track resume token updates
              if (updates.resume_token_hash) {
                scenario.newResumeTokenCreated = true;
              }
              return {
                eq: () => Promise.resolve({ data: null, error: null })
              };
            }
          };
        }
        return {};
      }
    }
  }));

  // ---- mock tokens.ts ----
  vi.doMock('../src/utils/tokens', () => ({
    verifyResumeToken: (t: string) => {
      if (!t?.startsWith('res_MOCK_')) throw new Error('RESUME_TOKEN_INVALID');
      return { userId: t.replace(/^res_MOCK_/, '') };
    },
    makeResumeToken: (userId: string) => `res_MOCK_NEW_${userId}`,
    hashResumeToken: (t: string) => `hashed_${t}`,
    resumeExpiryISO: () => new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    invalidateResumeToken: async (_userId: string) => {
      scenario.tokenInvalidated = true;
    },
  }));

  // ---- mock otp.service.ts ----
  vi.doMock('../src/services/otp.service', () => ({
    issueSignupOtp: async (_userId: string, _email: string, _fullName: string) => {
      scenario.otpIssued = true;
    },
    clearOtpState: async (_userId: string) => {
      scenario.otpCleared = true;
    },
  }));

  app = await buildApp();
});

const route = '/api/auth/pending/email';

describe('PATCH /auth/pending/email (Story 1.4)', () => {
  it('200 success: changes email, issues new resumeToken, sends OTP', async () => {
    const res = await request(app).patch(route).send({
        resumeToken: 'res_MOCK_user-123',
        newEmail: 'new@gmail.com',
      }).expect(200);

    expect(res.body).toEqual({ success: true, resumeToken: 'res_MOCK_NEW_user-123' });
    expect(scenario.emailUpdated).toBe(true);
    expect(scenario.tokenInvalidated).toBe(true);
    expect(scenario.otpCleared).toBe(true);
    expect(scenario.newResumeTokenCreated).toBe(true);
    expect(scenario.otpIssued).toBe(true);
  });

  it('400 VALIDATION_ERROR: invalid input', async () => {
    const res = await request(app).patch(route).send({
        resumeToken: 'invalid',
        newEmail: 'not-an-email',
      }).expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('401 RESUME_TOKEN_INVALID: invalid token format', async () => {
    const res = await request(app).patch(route).send({
        resumeToken: 'invalid_token_format',
        newEmail: 'test@gmail.com',
      }).expect(401);

    expect(res.body.code).toBe('RESUME_TOKEN_INVALID');
  });

  it('404 PENDING_NOT_FOUND: user not found', async () => {
    scenario.userSignup = null;
    
    const res = await request(app).patch(route).send({
        resumeToken: 'res_MOCK_nonexistent',
        newEmail: 'test@gmail.com',
      }).expect(404);

    expect(res.body.code).toBe('PENDING_NOT_FOUND');
  });

  it('409 EMAIL_EXISTS: newEmail belongs to active user', async () => {
    // Set up scenario where email already exists in profiles
    scenario.existingProfile = {
      id: 'existing-profile',
      email: 'taken@gmail.com',
    };
    
    const res = await request(app).patch(route).send({
        resumeToken: 'res_MOCK_user-123',
        newEmail: 'taken@gmail.com',
      }).expect(409);

    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('409 ALREADY_VERIFIED: user is already active', async () => {
    // Set up scenario with active user
    scenario.userSignup = {
      id: 'user-123',
      status: 'ACTIVE',
      signup_email: 'active@gmail.com',
      full_name: 'Active User',
    };
    
    const res = await request(app).patch(route).send({
        resumeToken: 'res_MOCK_user-123',
        newEmail: 'new@gmail.com',
      }).expect(409);

    expect(res.body.code).toBe('ALREADY_VERIFIED');
  });

  it('404 PENDING_NOT_FOUND: expired user', async () => {
    // Set up scenario with expired user
    scenario.userSignup = {
      id: 'user-123',
      status: 'EXPIRED',
      signup_email: 'expired@gmail.com',
      full_name: 'Expired User',
    };
    
    const res = await request(app).patch(route).send({
        resumeToken: 'res_MOCK_user-123',
        newEmail: 'new@gmail.com',
      }).expect(404);

    expect(res.body.code).toBe('PENDING_NOT_FOUND');
  });
});
