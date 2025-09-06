// tests/auth.resend-otp.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

type Signup = { id: string; status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED' };
type OtpRow = {
  id: string;
  user_id: string;
  last_sent_at: string | null;
  resend_count: number | null;
};

const scenario = {
  signup: null as Signup | null,
  otp: null as OtpRow | null,
  // Supabase lookup toggles
  supabaseError: false,
  supabaseMissing: false,
  // Capture sent emails
  sentOtps: [] as Array<{ userId: string; email: string; name?: string }>,
  // The email/name stored on user_signups (returned by Supabase .select)
  signupEmail: 'jane@gmail.com',
  signupName: 'Jane Doe',
};

const nowISO = () => new Date().toISOString();
const pastISO = (secs = 61) => new Date(Date.now() - secs * 1000).toISOString();

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // Default: pending signup with no OTP cooldown or cap hit
  scenario.signup = { id: 'u-1', status: 'PENDING_VERIFICATION' };
  scenario.otp = {
    id: 'otp-1',
    user_id: 'u-1',
    last_sent_at: null,
    resend_count: 0,
  };
  scenario.supabaseError = false;
  scenario.supabaseMissing = false;
  scenario.sentOtps = [];
  scenario.signupEmail = 'jane@gmail.com';
  scenario.signupName = 'Jane Doe';

  // Supabase mock (only what's needed by /auth/resend-otp)
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from(table: string) {
        if (table !== 'user_signups') {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
          };
        }
        const state: { id?: string; cols?: string } = {};
        const api = {
          select(cols: string) {
            state.cols = cols; // "signup_email, full_name"
            return api;
          },
          eq(col: string, val: string) {
            if (col === 'id') state.id = val;
            return api;
          },
          async maybeSingle<T>() {
            if (scenario.supabaseError) return { data: null, error: { message: 'boom' } };
            if (scenario.supabaseMissing) return { data: null, error: null };
            if (!state.id || !scenario.signup || scenario.signup.id !== state.id) {
              return { data: null, error: null };
            }
            const row: any = { signup_email: scenario.signupEmail, full_name: scenario.signupName };
            return { data: row as T, error: null };
          },
        };
        return api;
      },
    },
  }));

  // tokens: verifyResumeTokenStrict (route uses STRICT)
  vi.doMock('../src/utils/tokens', () => ({
    verifyResumeTokenStrict: async (t: string) => {
      if (!t || !t.startsWith('res_MOCK_')) throw new Error('RESUME_TOKEN_INVALID');
      return { userId: t.replace(/^res_MOCK_/, '') };
    },
  }));

  // otp.service pieces used by the route
  vi.doMock('../src/services/otp.service', () => ({
    loadPendingSignup: async (userId: string) => {
      if (scenario.signup && scenario.signup.id === userId) {
        const { id, status } = scenario.signup;
        return { data: { id, status }, error: null };
      }
      return { data: null, error: null };
    },
    getSignupOtp: async (userId: string) => {
      if (scenario.otp && scenario.otp.user_id === userId) {
        const { id, last_sent_at, resend_count } = scenario.otp;
        return { data: { id, last_sent_at, resend_count } };
      }
      return { data: null };
    },
    issueSignupOtp: async (userId: string, email: string, name?: string) => {
      scenario.sentOtps.push({ userId, email, name });
      // emulate service side-effects (optional, not required by route)
      if (scenario.otp && scenario.otp.user_id === userId) {
        scenario.otp.last_sent_at = nowISO();
        scenario.otp.resend_count = (scenario.otp.resend_count ?? 0) + 1;
      }
    },
  }));

  app = await buildApp();
});

const route = '/api/auth/resend-otp';

describe('POST /auth/resend-otp', () => {
  it('200 success: issues fresh OTP and sends email', async () => {
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(200);
    expect(res.body).toEqual({ success: true });
    expect(scenario.sentOtps.length).toBe(1);
    expect(scenario.sentOtps[0]).toEqual({
      userId: 'u-1',
      email: scenario.signupEmail,
      name: scenario.signupName,
    });
  });

  it('400 VALIDATION_ERROR when resumeToken missing', async () => {
    const res = await request(app).post(route).send({}).expect(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('401 RESUME_TOKEN_INVALID when token cannot be verified', async () => {
    const res = await request(app).post(route).send({ resumeToken: 'totally_invalid' }).expect(401);
    expect(res.body).toEqual({ code: 'RESUME_TOKEN_INVALID' });
  });

  it('404 PENDING_NOT_FOUND when pending signup row not found', async () => {
    // Make the token point to a user that doesn't exist in scenario
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_missing' }).expect(404);
    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('409 ALREADY_VERIFIED when signup status is ACTIVE', async () => {
    scenario.signup!.status = 'ACTIVE';
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(409);
    expect(res.body).toEqual({ code: 'ALREADY_VERIFIED' });
  });

  it('404 PENDING_NOT_FOUND when signup status is not PENDING_VERIFICATION (e.g., EXPIRED)', async () => {
    scenario.signup!.status = 'EXPIRED';
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(404);
    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('429 OTP_COOLDOWN when last_sent_at is within 60s', async () => {
    scenario.otp!.last_sent_at = nowISO(); // just sent
    scenario.otp!.resend_count = 1;
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(429);
    expect(res.body).toEqual({ code: 'OTP_COOLDOWN' });
  });

  it('429 OTP_RESEND_LIMIT when resend_count >= 5 and not in cooldown', async () => {
    scenario.otp!.last_sent_at = pastISO(61); // outside cooldown window
    scenario.otp!.resend_count = 5;           // at daily cap
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(429);
    expect(res.body).toEqual({ code: 'OTP_RESEND_LIMIT' });
  });

  it('404 PENDING_NOT_FOUND when Supabase returns no signup (race/consistency)', async () => {
    scenario.supabaseMissing = true;
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(404);
    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('500 INTERNAL when Supabase select errors', async () => {
    scenario.supabaseError = true;
    const res = await request(app).post(route).send({ resumeToken: 'res_MOCK_u-1' }).expect(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });

  it('429 TOO_MANY_REQUESTS after 3 calls/min for same IP+resumeToken (middleware rate limit)', async () => {
    const body = { resumeToken: 'totally_invalid' }; // doesn't start with 'res_MOCK_', so 401

    // First 3 requests should hit the handler and return 401
    for (let i = 0; i < 3; i++) {
        await request(app).post(route).send(body).expect(401);
    }

    // 4th request should be blocked by the rate limiter
    const res = await request(app).post(route).send(body).expect(429);
    expect(res.body).toEqual({ code: 'TOO_MANY_REQUESTS' });
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });
});
