// tests/auth.email-change.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { makeEmailChangeSupabaseMock, type EmailChangeScenario } from './utils/changeEmailMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const futureISO = (mins = 10) => new Date(Date.now() + mins * 60 * 1000).toISOString();
const pastISO = (mins = 10) => new Date(Date.now() - mins * 60 * 1000).toISOString();

// Scenario object that gets reset in beforeEach
let scenario: EmailChangeScenario & {
  // Additional fields for testing state
  user?: any;
  pendingChange?: any;
  profile?: any;
  existingEmailUser?: any;
  otpSent: boolean;
  emailUpdated: boolean;
  tokensInvalidated: boolean;
  pendingChangeCleared: boolean;
};

// JWT mock payload
const mockJwtPayload = {
  sub: 'user-123',
  tokenVersion: 1,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 900 // 15 min
};

// -------------------------
// Helper to (re)build app
// -------------------------
async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // Reset scenario with proper structure
  scenario = {
    // EmailChangeScenario required fields
    adminUserByEmail: null,
    adminListUsers: [],
    activeProfileByEmail: null,
    activeProfileByZid: null,
    pendingByEmail: null,
    pendingByZid: null,
    expiredByZid: null,
    expiredByEmail: null,
    createdSignupId: 'user-123',
    revivedSignupId: 'user-123',
    userSignupById: {
      id: 'user-123',
      password_hash: sha256('correct-password'),
      full_name: 'John Doe'
    },
    profileByEmail: null,
    profileById: {
      id: 'user-123',
      full_name: 'John Doe'
    },

    // Additional test state fields
    user: {
      id: 'user-123',
      password_hash: sha256('correct-password'),
      full_name: 'John Doe',
      status: 'ACTIVE'
    },
    pendingChange: {
      id: 'pending-1',
      user_id: 'user-123',
      pending_email: 'new@example.com',
      otp_hash: sha256('123456'),
      otp_expires_at: futureISO(10),
      otp_attempts: 0,
      last_otp_sent_at: new Date().toISOString(),
      resend_count: 0,
      locked_at: null,
    },
    profile: {
      id: 'user-123',
      full_name: 'John Doe'
    },
    existingEmailUser: null,
    otpSent: false,
    emailUpdated: false,
    tokensInvalidated: false,
    pendingChangeCleared: false,
  };

  // Mock Supabase with proper mock
  vi.doMock('../src/lib/supabase', () => ({
    supabase: makeEmailChangeSupabaseMock(scenario)
  }));

  // Mock JWT
  vi.doMock('jsonwebtoken', () => ({
    default: {
      verify: vi.fn((token: string) => {
        if (token === 'valid-token') return mockJwtPayload;
        throw new Error('Invalid token');
      }),
    },
    verify: vi.fn((token: string) => {
      if (token === 'valid-token') return mockJwtPayload;
      throw new Error('Invalid token');
    }),
  }));

  // Mock bcrypt
  vi.doMock('bcryptjs', () => ({
    compare: vi.fn(async (password: string, hash: string) => {
      return password === 'correct-password' && hash === sha256('correct-password');
    }),
  }));

  // Mock tokens
  vi.doMock('../src/utils/tokens', () => ({
    generateAccessToken: vi.fn(async () => 'new-access-token'),
    generateRefreshToken: vi.fn(async () => 'new-refresh-token'),
    invalidateRefreshToken: vi.fn(async () => {
      scenario.tokensInvalidated = true;
    }),
  }));

  // Mock email change service
  vi.doMock('../src/services/email.service', () => ({
    createPendingEmailChange: vi.fn(async (userId: string, email: string, otp: string) => {
      scenario.pendingChange = {
        id: 'pending-1',
        user_id: userId,
        pending_email: email,
        otp_hash: sha256(otp),
        otp_expires_at: futureISO(10),
        otp_attempts: 0,
        last_otp_sent_at: new Date().toISOString(),
        resend_count: 0,
        locked_at: null,
      };
    }),

    getPendingEmailChange: vi.fn(async (userId: string) => {
      if (scenario.pendingChange && scenario.pendingChange.user_id === userId) {
        return scenario.pendingChange;
      }
      return null;
    }),

    updateEmailChangeAttempts: vi.fn(async (userId: string, attempts: number, shouldLock: boolean) => {
      if (scenario.pendingChange && scenario.pendingChange.user_id === userId) {
        scenario.pendingChange.otp_attempts = attempts;
        if (shouldLock) {
          scenario.pendingChange.locked_at = new Date().toISOString();
        }
      }
    }),

    completePendingEmailChange: vi.fn(async (userId: string) => {
      scenario.emailUpdated = true;
      const email = scenario.pendingChange?.pending_email || 'new@example.com';
      scenario.pendingChangeCleared = true;
      return email;
    }),

    clearPendingEmailChange: vi.fn(async () => {
      scenario.pendingChangeCleared = true;
      scenario.pendingChange = null;
    }),

    resendEmailChangeOtp: vi.fn(async (userId: string, otp: string) => {
      if (scenario.pendingChange && scenario.pendingChange.user_id === userId) {
        scenario.pendingChange.otp_hash = sha256(otp);
        scenario.pendingChange.otp_attempts = 0;
        scenario.pendingChange.resend_count += 1;
        scenario.pendingChange.last_otp_sent_at = new Date().toISOString();
        scenario.pendingChange.locked_at = null;
      }
    }),
  }));

  // Mock OTP service
  vi.doMock('../src/services/otp.service', () => ({
    generateOtp: vi.fn(() => '123456'),
    hashOtp: (s: string) => sha256(s),
    issueSignupOtp: vi.fn(async () => {
      scenario.otpSent = true;
    }),
  }));

  // Mock generateOtp utility
  vi.doMock('../src/utils/otp', () => ({
    generateOtp: vi.fn(() => '123456'),
  }));

  app = await buildApp();
});

describe('POST /user/email/change-request (Story 1.10)', () => {
  const route = '/api/user/email/change-request';

  it('200 success: creates pending change and sends OTP', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        newEmail: 'new@example.com',
        currentPassword: 'correct-password',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      emailMasked: expect.stringMatching(/n.*@e.*/),
      expiresInSeconds: 600,
    });
    expect(scenario.otpSent).toBe(true);
  });

  it('400 VALIDATION_ERROR for invalid email', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        newEmail: 'invalid-email',
        currentPassword: 'correct-password',
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('401 NOT_AUTHENTICATED when no token provided', async () => {
    const res = await request(app)
      .post(route)
      .send({
        newEmail: 'new@example.com',
        currentPassword: 'correct-password',
      })
      .expect(401);

    expect(res.body.code).toBe('NOT_AUTHENTICATED');
  });

  it('500 INTERNAL when invalid token', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer invalid-token')
      .send({
        newEmail: 'new@example.com',
        currentPassword: 'correct-password',
      })
      .expect(500); // JWT throws error, caught as INTERNAL

    expect(res.body.code).toBe('INTERNAL');
  });

  it('404 USER_NOT_FOUND when user does not exist', async () => {
    scenario.userSignupById = null;

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        newEmail: 'new@example.com',
        currentPassword: 'correct-password',
      })
      .expect(404);

    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('400 VALIDATION_ERROR for incorrect password', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        newEmail: 'new@example.com',
        currentPassword: 'wrong-password',
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toBe('Incorrect password');
  });

  it('409 EMAIL_EXISTS when email is already in use', async () => {
    scenario.profileByEmail = {
      id: 'other-user'
    };

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        newEmail: 'existing@example.com',
        currentPassword: 'correct-password',
      })
      .expect(409);

    expect(res.body.code).toBe('EMAIL_EXISTS');
  });
});

describe('POST /user/email/verify-change (Story 1.11)', () => {
  const route = '/api/user/email/verify-change';

  it('200 success: verifies OTP and updates email', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      message: 'Email updated successfully',
      newAccessToken: 'new-access-token',
    });
    expect(scenario.emailUpdated).toBe(true);
    expect(scenario.tokensInvalidated).toBe(true);
  });

  it('400 VALIDATION_ERROR for invalid OTP format', async () => {
    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '12345', // Only 5 digits
      })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('401 NOT_AUTHENTICATED when no token', async () => {
    const res = await request(app)
      .post(route)
      .send({
        otp: '123456',
      })
      .expect(401);

    expect(res.body.code).toBe('NOT_AUTHENTICATED');
  });

  it('404 NO_PENDING_EMAIL_CHANGE when no pending change exists', async () => {
    scenario.pendingChange = null;

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(404);

    expect(res.body.code).toBe('NO_PENDING_EMAIL_CHANGE');
  });

  it('423 OTP_LOCKED when account is locked', async () => {
    scenario.pendingChange!.locked_at = new Date().toISOString();

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(423);

    expect(res.body.code).toBe('OTP_LOCKED');
  });

  it('400 OTP_EXPIRED when OTP has expired', async () => {
    scenario.pendingChange!.otp_expires_at = pastISO(1);

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(400);

    expect(res.body.code).toBe('OTP_EXPIRED');
  });

  it('400 OTP_INVALID for wrong OTP code', async () => {
    scenario.pendingChange!.otp_hash = sha256('000000'); // Different OTP

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(400);

    expect(res.body.code).toBe('OTP_INVALID');
    expect(scenario.pendingChange!.otp_attempts).toBe(1);
  });

  it('423 OTP_LOCKED after 5 failed attempts', async () => {
    scenario.pendingChange!.otp_hash = sha256('000000'); // Wrong OTP
    scenario.pendingChange!.otp_attempts = 4; // Will become 5

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send({
        otp: '123456',
      })
      .expect(423);

    expect(res.body.code).toBe('OTP_LOCKED');
    expect(scenario.pendingChange!.locked_at).not.toBeNull();
  });
});

describe('POST /user/email/resend-otp (Story 1.12)', () => {
  const route = '/api/user/email/resend-otp';

  it('200 success: resends OTP', async () => {
    // Set last sent to past cooldown period
    scenario.pendingChange!.last_otp_sent_at = pastISO(2);

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(200);

    expect(res.body).toMatchObject({
      success: true,
      expiresInSeconds: 600,
    });
    expect(scenario.pendingChange!.resend_count).toBe(1);
  });

  it('401 NOT_AUTHENTICATED when no token', async () => {
    const res = await request(app)
      .post(route)
      .send()
      .expect(401);

    expect(res.body.code).toBe('NOT_AUTHENTICATED');
  });

  it('404 NO_PENDING_EMAIL_CHANGE when no pending change', async () => {
    scenario.pendingChange = null;

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(404);

    expect(res.body.code).toBe('NO_PENDING_EMAIL_CHANGE');
  });

  it('429 OTP_COOLDOWN when within cooldown period', async () => {
    // Set last sent to 30 seconds ago (within 60s cooldown)
    scenario.pendingChange!.last_otp_sent_at = new Date(Date.now() - 30 * 1000).toISOString();

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(429);

    expect(res.body.code).toBe('OTP_COOLDOWN');
  });

  it('429 OTP_RESEND_LIMIT when daily limit reached', async () => {
    scenario.pendingChange!.resend_count = 5;
    scenario.pendingChange!.last_otp_sent_at = pastISO(2); // Outside cooldown

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(429);

    expect(res.body.code).toBe('OTP_RESEND_LIMIT');
  });
});

describe('DELETE /user/email/cancel-change (Story 1.13)', () => {
  const route = '/api/user/email/cancel-change';

  it('200 success: cancels pending email change', async () => {
    const res = await request(app)
      .delete(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(200);

    expect(res.body).toEqual({ success: true });
    expect(scenario.pendingChangeCleared).toBe(true);
  });

  it('200 success: idempotent when no pending change', async () => {
    scenario.pendingChange = null;

    const res = await request(app)
      .delete(route)
      .set('Authorization', 'Bearer valid-token')
      .send()
      .expect(200);

    expect(res.body).toEqual({ success: true });
  });

  it('401 NOT_AUTHENTICATED when no token', async () => {
    const res = await request(app)
      .delete(route)
      .send()
      .expect(401);

    expect(res.body.code).toBe('NOT_AUTHENTICATED');
  });
});