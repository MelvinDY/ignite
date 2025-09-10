// tests/auth.pending-context.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// -------------------------
// Shared mutable scenario
// -------------------------
type UserSignupRow = {
  id: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED';
  signup_email: string;
};

type UserOtpRow = {
  owner_id: string;
  last_sent_at: string;
  resend_count: number;
};

const scenario = {
  userSignup: null as UserSignupRow | null,
  userOtp: null as UserOtpRow | null,
};

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // Default: valid pending signup with recent OTP
  scenario.userSignup = {
    id: 'user-123',
    status: 'PENDING_VERIFICATION',
    signup_email: 'test@example.com',
  };

  const now = new Date().toISOString();
  scenario.userOtp = {
    owner_id: 'user-123',
    last_sent_at: now,
    resend_count: 0,
  };

  // ---- Mock Supabase ----
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'user_signups') {
          return {
            select: (_cols: string) => ({
              eq: (_col: string, val: string) => ({
                maybeSingle: () => {
                  if (scenario.userSignup && scenario.userSignup.id === val) {
                    return { data: scenario.userSignup, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        if (table === 'user_otps') {
          return {
            select: (_cols: string) => ({
              eq: (_col: string, val: string) => ({
                maybeSingle: () => {
                  if (scenario.userOtp && scenario.userOtp.owner_id === val) {
                    return { data: scenario.userOtp, error: null };
                  }
                  return { data: null, error: null };
                },
              }),
            }),
          };
        }
        return {};
      },
    },
  }));

  // ---- Mock tokens ----
  vi.doMock('../src/utils/tokens', () => ({
    verifyResumeTokenStrict: async (token: string) => {
      if (!token || !token.startsWith('res_MOCK_')) {
        throw new Error('RESUME_TOKEN_INVALID');
      }
      return { userId: token.replace(/^res_MOCK_/, '') };
    },
  }));

  // ---- Mock email utility ----
  vi.doMock('../src/utils/email', () => ({
    maskEmail: (email: string) => {
      // Simple mock implementation for testing
      const [local, domain] = email.split('@');
      const maskedLocal = local[0] + '***';
      const domainParts = domain.split('.');
      const maskedDomain = domainParts[0][0] + '***.' + domainParts[domainParts.length - 1];
      return `${maskedLocal}@${maskedDomain}`;
    },
  }));

  app = await buildApp();
});

const route = '/api/auth/pending/context';

describe('GET /auth/pending/context (Story 1.5)', () => {
  it('200 success: returns context with emailMasked, status, and resend info', async () => {
    const res = await request(app)
      .get(route)
      .query({ resumeToken: 'res_MOCK_user-123' })
      .expect(200);

    expect(res.body).toEqual({
      emailMasked: 't***@e***.com',
      status: 'PENDING_VERIFICATION',
      resend: {
        cooldownSeconds: expect.any(Number),
        remainingToday: 5,
      },
    });

    // Check cooldownSeconds is a valid number between 0 to 60 (inclusive)
    expect(res.body.resend.cooldownSeconds).toBeGreaterThanOrEqual(0);
    expect(res.body.resend.cooldownSeconds).toBeLessThanOrEqual(60);
  });

  it('401 RESUME_TOKEN_INVALID: missing resumeToken', async () => {
    const res = await request(app)
      .get(route)
      .expect(401);

    expect(res.body).toEqual({ code: 'RESUME_TOKEN_INVALID' });
  });

  it('401 RESUME_TOKEN_INVALID: invalid token format', async () => {
    const res = await request(app)
      .get(route)
      .query({ resumeToken: 'invalidtoken' })
      .expect(401);

    expect(res.body).toEqual({ code: 'RESUME_TOKEN_INVALID' });
  });

  it('404 PENDING_NOT_FOUND: user not found', async () => {
    scenario.userSignup = null; // user doesn't exist

    const res = await request(app)
      .get(route)
      .query({ resumeToken: 'res_MOCK_nonexistent' })
      .expect(404);

    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('404 PENDING_NOT_FOUND: user status is EXPIRED', async () => {
    scenario.userSignup!.status = 'EXPIRED';

    const res = await request(app)
      .get(route)
      .query({ resumeToken: 'res_MOCK_user-123' })
      .expect(404);

    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('409 ALREADY_VERIFIED: user status is ACTIVE', async () => {
    scenario.userSignup!.status = 'ACTIVE';

    const res = await request(app)
      .get(route)
      .query({ resumeToken: 'res_MOCK_user-123' })
      .expect(409);

    expect(res.body).toEqual({ code: 'ALREADY_VERIFIED' });
  });
});