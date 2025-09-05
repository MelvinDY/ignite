// tests/auth.verify-otp.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// -------------------------
// Shared mutable scenario
// -------------------------
type SignupRow = {
  id: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED';
};

type OtpRow = {
  id: string;
  user_id: string;
  otp_hash: string | null;
  expires_at: string | null;
  attempts: number;
  locked_at: string | null;
};

const scenario = {
  signup: null as SignupRow | null,
  otp: null as OtpRow | null,

  ensuredProfile: false,
  activated: false,
  otpDeleted: false,
  tokenInvalidated: false,
};

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const futureISO = (mins = 10) => new Date(Date.now() + mins * 60 * 1000).toISOString();
const pastISO = (mins = 10) => new Date(Date.now() - mins * 60 * 1000).toISOString();

// -------------------------
// Helper to (re)build app
// -------------------------
async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // Default: valid pending signup + valid OTP that matches "123456"
  scenario.signup = { id: 'u-1', status: 'PENDING_VERIFICATION' };
  scenario.otp = {
    id: 'otp-1',
    user_id: 'u-1',
    otp_hash: sha256('123456'),
    expires_at: futureISO(10),
    attempts: 0,
    locked_at: null,
  };
  scenario.ensuredProfile = false;
  scenario.activated = false;
  scenario.otpDeleted = false;
  scenario.tokenInvalidated = false;

  // Supabase never actually called in these tests (services are mocked), but mock anyway
  vi.doMock('../src/lib/supabase', () => ({ supabase: {} }));

  // ---- tokens mock (STRICT variant used by your route) ----
  vi.doMock('../src/utils/tokens', () => ({
    verifyResumeTokenStrict: async (t: string) => {
      // Expect "res_MOCK_<userId>"
      if (!t || !t.startsWith('res_MOCK_')) throw new Error('RESUME_TOKEN_INVALID');
      return { userId: t.replace(/^res_MOCK_/, '') };
    },
    invalidateResumeToken: async (_userId: string) => {
      scenario.tokenInvalidated = true;
    },
  }));

  // ---- otp.service mock (exact functions your route imports/uses) ----
  vi.doMock('../src/services/otp.service', () => ({
    hashOtp: (s: string) => sha256(s),

    loadPendingSignup: async (userId: string) => {
      if (scenario.signup && scenario.signup.id === userId) {
        const { id, status } = scenario.signup;
        return { data: { id, status }, error: null };
      }
      return { data: null, error: null };
    },

    getSignupOtp: async (userId: string) => {
      if (scenario.otp && scenario.otp.user_id === userId) {
        // mirror the shape your route expects to read:
        const { id, otp_hash, expires_at, attempts, locked_at } = scenario.otp;
        return { data: { id, otp_hash, expires_at, attempts, locked_at } };
      }
      return { data: null };
    },

    bumpAttemptsOrLock: async (otpId: string, attempts: number) => {
      // increment, set locked_at if >= 5, reflect in scenario
      if (scenario.otp && scenario.otp.id === otpId) {
        scenario.otp.attempts = attempts + 1;
        if (scenario.otp.attempts >= 5 && !scenario.otp.locked_at) {
          scenario.otp.locked_at = new Date().toISOString();
        }
        return scenario.otp.attempts;
      }
      return attempts + 1;
    },

    deleteSignupOtp: async (_userId: string) => {
      scenario.otpDeleted = true;
      // emulate delete by nulling it out
      scenario.otp = null;
    },

    activateUser: async (userId: string) => {
      if (scenario.signup && scenario.signup.id === userId) {
        scenario.signup.status = 'ACTIVE';
      }
      scenario.activated = true;
    },
  }));

  // ---- profile.service mock ----
  vi.doMock('../src/services/profile.service', () => ({
    ensureProfileForSignup: async (_userId: string) => {
      scenario.ensuredProfile = true;
      return 'profile-1';
    },
  }));

  app = await buildApp();
});

const route = '/api/auth/verify-otp';

describe('POST /auth/verify-otp (Story 1.2)', () => {
  it('200 success: activates, deletes OTP, invalidates token, ensures profile', async () => {
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(200);

    expect(res.body).toEqual({ success: true, message: 'Account verified successfully' });
    expect(scenario.ensuredProfile).toBe(true);
    expect(scenario.activated).toBe(true);
    expect(scenario.otpDeleted).toBe(true);
    expect(scenario.tokenInvalidated).toBe(true);
    expect(scenario.signup?.status).toBe('ACTIVE');
  });

  it('400 VALIDATION_ERROR for bad payload', async () => {
    // otp not 6 digits
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '12a',
    }).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('401 RESUME_TOKEN_INVALID when verifyResumeTokenStrict throws', async () => {
    const res = await request(app).post(route).send({
      resumeToken: 'not_prefixed_right',
      otp: '123456',
    }).expect(401);
    expect(res.body).toEqual({ code: 'RESUME_TOKEN_INVALID' });
  });

  it('404 PENDING_NOT_FOUND when no row for userId', async () => {
    // Make the token userId not match any signup row
    scenario.signup!.id = 'different-id';
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(404);
    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('409 ALREADY_VERIFIED when status = ACTIVE', async () => {
    scenario.signup!.status = 'ACTIVE';
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(409);
    expect(res.body).toEqual({ code: 'ALREADY_VERIFIED' });
  });

  it('400 OTP_EXPIRED bumps attempts by 1', async () => {
    scenario.otp!.expires_at = pastISO(1);
    scenario.otp!.attempts = 2;

    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(400);

    expect(res.body).toEqual({ code: 'OTP_EXPIRED' });
    expect(scenario.otp!.attempts).toBe(3);
  });

  it('400 OTP_INVALID increments attempts (not locked yet)', async () => {
    // Wrong code
    scenario.otp!.otp_hash = sha256('000000');
    scenario.otp!.attempts = 3;

    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(400);

    expect(res.body).toEqual({ code: 'OTP_INVALID' });
    expect(scenario.otp!.attempts).toBe(4);
    expect(scenario.otp!.locked_at).toBeNull();
  });

  it('423 OTP_LOCKED when attempts reach 5', async () => {
    scenario.otp!.otp_hash = sha256('000000'); // wrong
    scenario.otp!.attempts = 4;                // will become 5

    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(423);

    expect(res.body).toEqual({ code: 'OTP_LOCKED' });
    expect(scenario.otp!.attempts).toBe(5);
    expect(scenario.otp!.locked_at).not.toBeNull();
  });

  it('429 TOO_MANY_REQUESTS after 10 requests per IP+resumeToken', async () => {
    // Use an invalid token so the route returns 401 each time and never touches OTP/lock logic.
    const body = { resumeToken: 'totally_invalid', otp: '000000' };

    for (let i = 0; i < 10; i++) {
      await request(app).post(route).send(body);
    }
    const res = await request(app).post(route).send(body).expect(429);

    expect(res.body).toEqual({ code: 'TOO_MANY_REQUESTS' });
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });

  it('404 PENDING_NOT_FOUND when OTP row missing', async () => {
    // Signup exists & pending, but no OTP row
    scenario.otp = null;

    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(404);

    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('423 OTP_LOCKED when locked_at is already set', async () => {
    scenario.otp!.locked_at = new Date().toISOString();

    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(423);

    expect(res.body).toEqual({ code: 'OTP_LOCKED' });
  });
});
