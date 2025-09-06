// tests/auth.register.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  scenario = {
    adminUserByEmail: null,
    adminListUsers: [],
    activeProfileByEmail: null,        // <-- needed for EMAIL_EXISTS test
    activeProfileByZid: null,
    pendingByEmail: null,
    pendingByZid: null,
    expiredByZid: null,
    expiredByEmail: null,
    createdSignupId: 'signup-created-1',
    revivedSignupId: 'signup-revived-1',
  };

  // 1) Mock Supabase BEFORE importing app
  vi.doMock('../src/lib/supabase', () => ({
    supabase: makeSupabaseMock(scenario),
  }));

  // 2) Mock tokens BEFORE importing app (must export everything router imports)
  vi.doMock('../src/utils/tokens', () => {
    const crypto = require('crypto');
    return {
      // used by /auth/register
      makeResumeToken: (userId: string) => `res_MOCK_${userId}`,
      hashResumeToken: (t: string) =>
        crypto.createHash('sha256').update(t).digest('hex'),
      resumeExpiryISO: () =>
        new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      rotateResumeToken: async (userId: string) => `res_MOCK_${userId}`,
      invalidateResumeToken: async (_: string) => {},

      // used by verify/resend; keep simple
      verifyResumeToken: (t: string) => ({ userId: t.replace(/^res_MOCK_/, '') }),
      verifyResumeTokenStrict: async (t: string) => ({
        userId: t.replace(/^res_MOCK_/, ''),
      }),

      // router also imports these for /auth/login & /auth/refresh
      generateAccessToken: (userId: string) => `acc_MOCK_${userId}`,
      generateRefreshToken: (userId: string) => `ref_MOCK_${userId}`,
    };
  });

  // 3) Mock OTP service (router imports multiple symbols)
  // Keep no-ops except issueSignupOtp which we track for assertions if needed.
  vi.doMock('../src/services/otp.service', () => {
    const _sentOtps: Array<{ userId: string; email: string; name?: string }> = [];
    return {
      _sentOtps,
      issueSignupOtp: async (userId: string, email: string, name?: string) => {
        _sentOtps.push({ userId, email, name });
      },
      // The rest are imported by the router but unused in these tests
      bumpAttemptsOrLock: async () => 0,
      deleteSignupOtp: async () => {},
      getSignupOtp: async () => ({ data: null }),
      loadPendingSignup: async () => ({ data: null, error: null }),
      hashOtp: (s: string) => s,
      activateUser: async () => {},
    };
  });

  app = await buildApp();
});

const route = '/api/auth/register';
const baseBody = {
  fullName: 'Jane Doe',
  zid: 'z1234567',
  level: 'undergrad',
  yearIntake: 2024,
  isIndonesian: true,
  program: 'BE',
  major: 'Software Engineering',
  email: 'jane@gmail.com',
  password: 'Abcd1234',
  confirmPassword: 'Abcd1234',
};

describe('POST /auth/register (Story 1.1)', () => {
  it('201 new signup: creates PENDING row, sends OTP, returns resumeToken', async () => {
    const res = await request(app).post(route).send(baseBody).expect(201);
    expect(res.body).toMatchObject({
      success: true,
      userId: 'signup-created-1',
      resumeToken: 'res_MOCK_signup-created-1',
    });
  });

  it('409 EMAIL_EXISTS when email already used by ACTIVE profile', async () => {
    scenario.activeProfileByEmail = { id: 'p-email-1' }; // set before (re)building app
    app = await (async () => await buildApp())();
    const res = await request(app).post(route).send(baseBody).expect(409);
    expect(res.body).toEqual({ code: 'EMAIL_EXISTS' });
  });

  it('409 ZID_EXISTS when profiles has ACTIVE user with same zID', async () => {
    scenario.activeProfileByZid = { id: 'p1' };
    app = await (async () => await buildApp())();
    const res = await request(app).post(route).send(baseBody).expect(409);
    expect(res.body).toEqual({ code: 'ZID_EXISTS' });
  });

  it('409 PENDING_VERIFICATION_EXISTS (email) returns fresh resumeToken', async () => {
    scenario.pendingByEmail = { id: 'pending-123', zid: 'z1234567' }; // ensure zid matches body.zid
    app = await (async () => await buildApp())();
    const res = await request(app).post(route).send(baseBody).expect(409);
    expect(res.body).toEqual({
      code: 'PENDING_VERIFICATION_EXISTS',
      resumeToken: 'res_MOCK_pending-123',
    });
  });

  it.skip('201 revive EXPIRED by zID, OTP sent, returns resumeToken', async () => {
    scenario.expiredByZid = { id: 'exp-9', signup_email: 'old@mail.com' };
    app = await (async () => await buildApp())();
    const res = await request(app).post(route).send(baseBody).expect(201);
    expect(res.body).toMatchObject({
      success: true,
      userId: 'signup-revived-1',
      resumeToken: 'res_MOCK_signup-revived-1',
    });
    const { _sentOtps } = await import('../src/services/otp.service' as any);
    expect(_sentOtps[0]).toEqual({
      userId: 'signup-revived-1',
      email: baseBody.email.toLowerCase(),
    });
  });

  it.skip('409 ZID_MISMATCH when EXPIRED exists for same email but different zID', async () => {
    scenario.expiredByEmail = { id: 'exp-5', zid: 'z9999999' }; // different from body.zid
    app = await (async () => await buildApp())();
    const res = await request(app).post(route).send(baseBody).expect(409);
    expect(res.body).toEqual({ code: 'ZID_MISMATCH' });
  });

  it('400 VALIDATION_ERROR when zID invalid', async () => {
    const bad = { ...baseBody, zid: 'x1234567' };
    const res = await request(app).post(route).send(bad).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details?.fieldErrors?.zid?.length).toBeGreaterThan(0);
  });

  it('429 TOO_MANY_REQUESTS after 10 req/hour per IP+email', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post(route).send(baseBody);
    }
    const res = await request(app).post(route).send(baseBody).expect(429);
    expect(res.body).toEqual({ code: 'TOO_MANY_REQUESTS' });
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.headers['x-ratelimit-reset']).toBeDefined();
  });
});
