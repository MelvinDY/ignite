import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// ---- shared mutable “scenario” used by mocks ----
type PendingRow = {
  id: string;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'EXPIRED';
  otp_hash: string | null;
  otp_expires_at: string | null;
  otp_attempts: number;
};
const scenario = {
  // what /verify-otp sees after verifyResumeToken -> loadPendingSignup(userId)
  row: null as PendingRow | null,
  // instrumentation flags
  activated: false,
  cleared: false,
  invalidated: false,
  ensuredProfile: false,
};

// simple SHA-256 helper (same as your hashOtp)
import crypto from 'crypto';
const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const futureISO = (mins = 10) => new Date(Date.now() + mins * 60 * 1000).toISOString();
const pastISO = (mins = 10) => new Date(Date.now() - mins * 60 * 1000).toISOString();

// rebuild app with fresh mocks every test
async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // default “good” pending row
  scenario.row = {
    id: 'u-1',
    status: 'PENDING_VERIFICATION',
    otp_hash: hash('123456'),
    otp_expires_at: futureISO(10),
    otp_attempts: 0,
  };
  scenario.activated = false;
  scenario.cleared = false;
  scenario.invalidated = false;
  scenario.ensuredProfile = false;

  vi.doMock('../src/lib/supabase', () => ({ supabase: {} }));

  // ---- mock tokens.ts (verify + invalidate) ----
  vi.doMock('../src/utils/tokens', () => ({
    verifyResumeToken: (t: string) => {
      // expect tokens like res_MOCK_<id>
      if (!t?.startsWith('res_MOCK_')) throw new Error('RESUME_TOKEN_INVALID');
      return { userId: t.replace(/^res_MOCK_/, '') };
    },
    invalidateResumeToken: async (_userId: string) => {
      scenario.invalidated = true;
    },
  }));

  // ---- mock otp.service.ts (only the functions used by route) ----
  vi.doMock('../src/services/otp.service', () => ({
    // use the same hashing logic as app
    hashOtp: (s: string) => hash(s),
    loadPendingSignup: async (userId: string) => {
      // return scenario.row if ids match; else null
      if (scenario.row && scenario.row.id === userId) {
        const { id, status, otp_hash, otp_expires_at, otp_attempts } = scenario.row;
        return { data: { id, status, otp_hash, otp_expires_at, otp_attempts }, error: null };
      }
      return { data: null, error: null };
    },
    incrementOtpAttempts: async (userId: string) => {
      if (scenario.row && scenario.row.id === userId) scenario.row.otp_attempts += 1;
    },
    clearOtpState: async (_userId: string) => { scenario.cleared = true; },
    activateUser: async (userId: string) => {
      if (scenario.row && scenario.row.id === userId) scenario.row.status = 'ACTIVE';
      scenario.activated = true;
    },
  }));

  // ---- mock profile.service.ts ----
  vi.doMock('../src/services/profile.service', () => ({
    ensureProfileForSignup: async (_userId: string) => {
      scenario.ensuredProfile = true;
      return 'profile-1';
    },
  }));

  const mod = await import('../src/app');
  app = await mod.createApp();
});

const route = '/api/auth/verify-otp';

describe('POST /auth/verify-otp (Story 1.2)', () => {
  it('200 success: activates, clears OTP, invalidates token, ensures profile', async () => {
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(200);

    expect(res.body).toEqual({ success: true, message: 'Account verified successfully' });
    expect(scenario.ensuredProfile).toBe(true);
    expect(scenario.activated).toBe(true);
    expect(scenario.cleared).toBe(true);
    expect(scenario.invalidated).toBe(true);
    expect(scenario.row?.status).toBe('ACTIVE');
  });

  it('400 VALIDATION_ERROR for bad payload', async () => {
    // bad: otp not 6 digits
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '12a',
    }).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('401 RESUME_TOKEN_INVALID when verifyResumeToken throws', async () => {
    const res = await request(app).post(route).send({
      resumeToken: 'not_prefixed_right',
      otp: '123456',
    }).expect(401);
    expect(res.body).toEqual({ code: 'RESUME_TOKEN_INVALID' });
  });

  it('404 PENDING_NOT_FOUND when no row for userId', async () => {
    // change id so loadPendingSignup returns null
    scenario.row!.id = 'different-id';
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(404);
    expect(res.body).toEqual({ code: 'PENDING_NOT_FOUND' });
  });

  it('409 ALREADY_VERIFIED when row.status = ACTIVE', async () => {
    scenario.row!.status = 'ACTIVE';
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(409);
    expect(res.body).toEqual({ code: 'ALREADY_VERIFIED' });
  });

  it('400 OTP_EXPIRED when otp_expires_at is in the past (and increments attempts)', async () => {
    scenario.row!.otp_expires_at = pastISO(1);
    scenario.row!.otp_attempts = 2;
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(400);
    expect(res.body).toEqual({ code: 'OTP_EXPIRED' });
    expect(scenario.row!.otp_attempts).toBe(3);
  });

  it('400 OTP_INVALID increments attempts (but not lock yet)', async () => {
    scenario.row!.otp_hash = hash('000000'); // wrong code
    scenario.row!.otp_attempts = 3;
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(400);
    expect(res.body).toEqual({ code: 'OTP_INVALID' });
    expect(scenario.row!.otp_attempts).toBe(4);
  });

  it('423 OTP_LOCKED when attempts reach 5', async () => {
    scenario.row!.otp_hash = hash('000000');
    scenario.row!.otp_attempts = 4; // will become 5
    const res = await request(app).post(route).send({
      resumeToken: 'res_MOCK_u-1',
      otp: '123456',
    }).expect(423);
    expect(res.body).toEqual({ code: 'OTP_LOCKED' });
    expect(scenario.row!.otp_attempts).toBe(5);
  });

  it('429 TOO_MANY_REQUESTS after 10 attempts for same resumeToken/IP', async () => {
    const body = { resumeToken: 'res_MOCK_u-1', otp: '000000' }; // bad code to avoid activation
    // keep attempts low so route doesn’t lock before rate limit
    scenario.row!.otp_hash = hash('111111');
    scenario.row!.otp_attempts = 0;

    for (let i = 0; i < 10; i++) {
      await request(app).post(route).send(body);
    }
    const res = await request(app).post(route).send(body).expect(429);
    expect(res.body).toEqual({ code: 'TOO_MANY_REQUESTS' });
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});
