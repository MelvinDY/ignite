// tests/auth.reset-password-flow.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// Mock memory + scenario
type Profile = { id: string; status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED'; full_name?: string; email: string };
type OtpRow = {
  id: string;
  owner_table: 'profiles';
  owner_id: string;
  purpose: 'RESET_PASSWORD';
  otp_hash: string;
  expires_at: string;    // ISO
  attempts: number;
  resend_count: number;
  last_sent_at: string | null;
  locked_at: string | null;
};
type SignupRow = { id: string; profile_id: string; status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'EXPIRED'; password_hash?: string };

type Scenario = {
  // Directory of ACTIVE profiles by lowercased email
  profilesByEmail: Record<string, Profile | undefined>;

  // Single OTP row for the active profile in our tests (simple for clarity)
  otpRow: OtpRow | null;

  // A mapping profileId -> signupRow (used by /password/reset)
  signupByProfileId: Record<string, SignupRow | undefined>;

  // Trackers for side-effects
  sentResetOtps: Array<{ profileId: string; email: string; name?: string; type: 'issue' | 'resend' }>;
  invalidatedRefresh: Array<{ signupId: string }>;
};

let scenario: Scenario;

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

function future(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
function past(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

beforeEach(async () => {
  await vi.resetModules();

  // reset scenario to a clean default
  scenario = {
    profilesByEmail: {
      'jane@gmail.com': { id: 'p1', status: 'ACTIVE', full_name: 'Jane', email: 'jane@gmail.com' },
    },
    otpRow: null,
    signupByProfileId: {
      p1: { id: 's1', profile_id: 'p1', status: 'ACTIVE', password_hash: 'OLD_HASH' },
    },
    sentResetOtps: [],
    invalidatedRefresh: [],
  };

  // ---- supabase mock ----
  vi.doMock('../src/lib/supabase', () => {
    // minimal chainable query builder for what the routes/services call
    function from(table: string) {
      const state = {
        table,
        selectCols: '*',
        filters: [] as Array<{ key: string; val: any }>,
        _idFilter: undefined as undefined | string,
        _updatePatch: undefined as any,
      };

      const api = {
        select(cols: string) {
          state.selectCols = cols;
          return api;
        },
        eq(key: string, val: any) {
          if (key === 'id') state._idFilter = String(val);
          else state.filters.push({ key, val });
          return api;
        },
        async maybeSingle() {
          try {
            if (state.table === 'profiles') {
              const emailF = state.filters.find(f => f.key === 'email')?.val?.toLowerCase?.();
              const statusF = state.filters.find(f => f.key === 'status')?.val;
              if (!emailF) return { data: null, error: null };
              const p = scenario.profilesByEmail[emailF] || null;
              if (!p) return { data: null, error: null };
              if (statusF && p.status !== statusF) return { data: null, error: null };
              return { data: { id: p.id, status: p.status, full_name: p.full_name, email: p.email }, error: null };
            }

            if (state.table === 'user_signups') {
              // used by /password/reset to map profileId->ACTIVE signup
              const profId = state.filters.find(f => f.key === 'profile_id')?.val;
              const statusF = state.filters.find(f => f.key === 'status')?.val;
              if (!profId) return { data: null, error: null };
              const row = scenario.signupByProfileId[profId] || null;
              if (!row) return { data: null, error: null };
              if (statusF && row.status !== statusF) return { data: null, error: null };
              return { data: { id: row.id, status: row.status }, error: null };
            }

            if (state.table === 'user_otps') {
              return { data: null, error: null };
            }

            return { data: null, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },
        async single() {
          const out = await api.maybeSingle();
          if (!out.data) return { data: null, error: new Error('not found') };
          return out;
        },
        update(patch: any) {
          return {
            eq: async (key: string, val: any) => {
              try {
                if (state.table === 'user_otps') {
                  // Common path: update by id
                  if (key === 'id') {
                    if (scenario.otpRow && scenario.otpRow.id === String(val)) {
                      scenario.otpRow = { ...scenario.otpRow, ...patch };
                      return { data: scenario.otpRow ? { id: scenario.otpRow.id } : null, error: null };
                    }
                    return { data: null, error: null };
                  }

                  // (Optional) Support updating by (owner_table, owner_id, purpose)
                  state.filters.push({ key, val });
                  const ownerTable = state.filters.find(f => f.key === 'owner_table')?.val;
                  const ownerId = state.filters.find(f => f.key === 'owner_id')?.val;
                  const purpose = state.filters.find(f => f.key === 'purpose')?.val;

                  if (ownerTable && ownerId && purpose) {
                    if (scenario.otpRow &&
                      scenario.otpRow.owner_table === ownerTable &&
                      scenario.otpRow.owner_id === ownerId &&
                      scenario.otpRow.purpose === purpose) {
                      scenario.otpRow = { ...scenario.otpRow, ...patch };
                      return { data: scenario.otpRow ? { id: scenario.otpRow.id } : null, error: null };
                    }
                  }

                  return { data: null, error: null };
                }

                if (state.table === 'user_signups') {
                  // Your 1.16 route does: update(...).eq('id', signupId)
                  if (key === 'id') {
                    const signup = Object.values(scenario.signupByProfileId).find(s => s?.id === String(val));
                    if (signup) {
                      Object.assign(signup, patch);
                      return { data: { id: signup.id }, error: null };
                    }
                    return { data: null, error: null };
                  }
                  return { data: null, error: null };
                }

                // default noop
                return { data: null, error: null };
              } catch (e: any) {
                return { data: null, error: e };
              }
            }
          };
        },
        delete() {
          return {
            eq: async (key: string, val: any) => {
              try {
                if (state.table === 'user_otps') {
                  // delete by id
                  if (key === 'id') {
                    if (scenario.otpRow && scenario.otpRow.id === String(val)) {
                      scenario.otpRow = null;
                    }
                    return { data: null, error: null };
                  }

                  state.filters.push({ key, val });
                  const ownerTable = state.filters.find(f => f.key === 'owner_table')?.val;
                  const ownerId = state.filters.find(f => f.key === 'owner_id')?.val;
                  const purpose = state.filters.find(f => f.key === 'purpose')?.val;

                  if (ownerTable && ownerId && purpose) {
                    if (scenario.otpRow &&
                      scenario.otpRow.owner_table === ownerTable &&
                      scenario.otpRow.owner_id === ownerId &&
                      scenario.otpRow.purpose === purpose) {
                      scenario.otpRow = null;
                    }
                  }
                  return { data: null, error: null };
                }

                // default noop for other tables
                return { data: null, error: null };
              } catch (e: any) {
                return { data: null, error: e };
              }
            }
          };
        },
        async upsert(_row: any, _opts?: any) {
          return { data: null, error: null };
        },
      };

      return api;
    }

    return { supabase: { from } as any };
  });

  // ---- token utils mock ----
  vi.doMock('../src/utils/tokens', () => {
    return {
      makeResetSessionToken: (profileId: string) => ({ token: `rst_MOCK_${profileId}`, expiresIn: 600 }),
      verifyResetSessionToken: (token: string) => {
        if (!token?.startsWith('rst_MOCK_')) throw new Error('RESET_SESSION_TOKEN_INVALID');
        return { profileId: token.replace(/^rst_MOCK_/, '') };
      },
      invalidateRefreshToken: async (signupId: string) => {
        scenario.invalidatedRefresh.push({ signupId });
      },
      // keep exports used elsewhere (no-ops for unused)
      generateAccessToken: async () => 'acc_UNUSED',
      generateRefreshToken: async () => 'ref_UNUSED',
    };
  });

  // ---- otp service mock ----
  vi.doMock('../src/services/otp.service', () => {
    return {
      // identity "hash" so we can set otpRow.otp_hash directly to the expected OTP
      hashOtp: (s: string) => s,
      getResetPasswordOtp: async (profileId: string) => {
        if (scenario.otpRow && scenario.otpRow.owner_id === profileId) {
          // shape matches supabase maybeSingle()
          return { data: { ...scenario.otpRow }, error: null };
        }
        return { data: null, error: null };
      },
      issueResetPasswordOtp: async (profileId: string, email: string, name?: string) => {
        // write a fresh row
        scenario.otpRow = {
          id: 'otp1',
          owner_table: 'profiles',
          owner_id: profileId,
          purpose: 'RESET_PASSWORD',
          otp_hash: '000000', // unknown to client; tests will override as needed
          expires_at: future(10),
          attempts: 0,
          resend_count: 0,
          last_sent_at: new Date().toISOString(),
          locked_at: null,
        };
        scenario.sentResetOtps.push({ profileId, email, name, type: 'issue' });
      },
      resendResetPasswordOtp: async (profileId: string, email: string, name?: string) => {
        if (!scenario.otpRow) throw new Error('No row to resend');
        // overwrite hash/expiry/attempts/last_sent_at; increment resend_count
        scenario.otpRow.otp_hash = '000000';
        scenario.otpRow.expires_at = future(10);
        scenario.otpRow.attempts = 0;
        const now = new Date().toISOString();
        const last = scenario.otpRow.last_sent_at ? new Date(scenario.otpRow.last_sent_at) : null;
        const isSameDay = last ? last.toDateString() === new Date(now).toDateString() : false;
        scenario.otpRow.resend_count = isSameDay ? (scenario.otpRow.resend_count || 0) + 1 : 1;
        scenario.otpRow.last_sent_at = now;
        scenario.otpRow.locked_at = null;
        scenario.sentResetOtps.push({ profileId, email, name, type: 'resend' });
      },
      deleteResetPasswordOtp: async (profileId: string) => {
        if (
          scenario.otpRow &&
          scenario.otpRow.owner_table === 'profiles' &&
          scenario.otpRow.owner_id === profileId &&
          scenario.otpRow.purpose === 'RESET_PASSWORD'
        ) {
          scenario.otpRow = null;
        }
      },
    };
  });

  // ---- email+password helpers ----
  vi.doMock('../src/utils/crypto', () => ({
    hashPassword: async (s: string) => `HASH(${s})`,
  }));

  // ---- password-reset service mock (for 1.14/1.17/1.18 routes) ----
  vi.doMock('../src/services/password-reset.service', () => {
    const COOLDOWN_SECONDS = 60;
    const DAILY_CAP = 5;

    const { getResetPasswordOtp, issueResetPasswordOtp, resendResetPasswordOtp } =
      require('../src/services/otp.service');

    async function processResetOtpRequest(emailLower: string, message: string, logTag?: string) {
      const profile = scenario.profilesByEmail[emailLower];
      if (!profile || profile.status !== 'ACTIVE') {
        return { success: true, message };
      }

      // cooldown & daily cap
      const row = scenario.otpRow && scenario.otpRow.owner_id === profile.id ? scenario.otpRow : null;
      const now = new Date();
      let canSend = true;

      if (row) {
        if (row.locked_at) canSend = false;
        if (canSend && row.last_sent_at) {
          const last = new Date(row.last_sent_at);
          const diffSec = Math.floor((now.getTime() - last.getTime()) / 1000);
          if (diffSec < COOLDOWN_SECONDS) canSend = false;
        }
        if (canSend) {
          const lastDate = row.last_sent_at ? new Date(row.last_sent_at) : null;
          const isSameDay = lastDate ? lastDate.toDateString() === now.toDateString() : false;
          const resendCountToday = isSameDay ? (row.resend_count || 0) : 0;
          if (resendCountToday >= DAILY_CAP) canSend = false;
        }
      }

      if (canSend) {
        if (!row) {
          await issueResetPasswordOtp(profile.id, emailLower, profile.full_name);
        } else {
          await resendResetPasswordOtp(profile.id, emailLower, profile.full_name);
        }
      }
      return { success: true, message };
    }

    async function processCancelResetOtp(emailLower: string) {
      const profile = scenario.profilesByEmail[emailLower];
      if (!profile || profile.status !== 'ACTIVE') {
        return { success: true };
      }
      // delete the row if present
      if (scenario.otpRow && scenario.otpRow.owner_id === profile.id) {
        scenario.otpRow = null;
      }
      return { success: true };
    }

    return { processResetOtpRequest, processCancelResetOtp };
  });

  // finally import app
  app = await buildApp();
});

// ---------------------------
// Routes under test
// ---------------------------
const RQ_ROUTE = '/api/auth/password/request-reset';
const VR_ROUTE = '/api/auth/password/verify-otp';
const RS_ROUTE = '/api/auth/password/reset';
const RE_ROUTE = '/api/auth/password/resend-otp';
const CC_ROUTE = '/api/auth/password/cancel';

// ---------------------------
// TESTS
// ---------------------------
describe('Reset Password Flow (Stories 1.14 until 1.18)', () => {
  // 1.14 – Request Password Reset (Start)
  describe('POST /auth/password/request-reset (1.14)', () => {
    it('returns 200 and issues OTP for ACTIVE profile (enumeration-safe)', async () => {
      const res = await request(app).post(RQ_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res.body).toEqual({ success: true, message: 'If this email exists, a code has been sent.' });
      expect(scenario.sentResetOtps).toEqual([
        { profileId: 'p1', email: 'jane@gmail.com', name: 'Jane', type: 'issue' },
      ]);
      expect(scenario.otpRow?.owner_id).toBe('p1');
    });

    it('returns 200 and does not issue OTP for unknown email (enumeration-safe)', async () => {
      const res = await request(app).post(RQ_ROUTE).send({ email: 'unknown@mail.com' }).expect(200);
      expect(res.body.success).toBe(true);
      expect(scenario.sentResetOtps.length).toBe(0);
      expect(scenario.otpRow).toBeNull();
    });

    it('respects cooldown (>=60s) and daily cap (<=5/day), still 200 generic', async () => {
      // seed an existing row with last_sent_at = now (cooldown active)
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '000000',
        expires_at: future(10),
        attempts: 0,
        resend_count: 0,
        last_sent_at: new Date().toISOString(),
        locked_at: null,
      };
      const res1 = await request(app).post(RQ_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res1.body.success).toBe(true);
      // no new email sent
      expect(scenario.sentResetOtps.length).toBe(0);

      // lift cooldown and hit daily cap
      scenario.otpRow.last_sent_at = past(70 / 60); // ~70s ago
      scenario.otpRow.resend_count = 5; // already at cap
      const res2 = await request(app).post(RQ_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res2.body.success).toBe(true);
      expect(scenario.sentResetOtps.length).toBe(0);
    });

    it('400 VALIDATION_ERROR on bad email', async () => {
      const res = await request(app).post(RQ_ROUTE).send({ email: 'not-an-email' }).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // 1.17 – Resend Password Reset OTP
  describe('POST /auth/password/resend-otp (1.17)', () => {
    it('resends when allowed (200 generic) and increments resend_count', async () => {
      // seed an existing row that is out of cooldown and under cap
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '000000',
        expires_at: future(10),
        attempts: 0,
        resend_count: 2,
        last_sent_at: past(2), // 2 mins ago
        locked_at: null,
      };
      const res = await request(app).post(RE_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res.body).toEqual({ success: true, message: 'If this email exists, a new code has been sent.' });
      expect(scenario.sentResetOtps.at(-1)).toMatchObject({ profileId: 'p1', email: 'jane@gmail.com', type: 'resend' });
      expect(scenario.otpRow?.resend_count).toBe(3);
    });

    it('still 200 generic if cooldown not met (no resend performed)', async () => {
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '000000',
        expires_at: future(10),
        attempts: 0,
        resend_count: 0,
        last_sent_at: new Date().toISOString(), // now
        locked_at: null,
      };
      const res = await request(app).post(RE_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res.body.success).toBe(true);
      // no resend
      expect(scenario.sentResetOtps.length).toBe(0);
    });

    it('400 VALIDATION_ERROR on bad email', async () => {
      const res = await request(app).post(RE_ROUTE).send({ email: 'bad' }).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // 1.15 – Verify Password Reset OTP (Create reset session)
  describe('POST /auth/password/verify-otp (1.15)', () => {
    it('200 with resetSessionToken when OTP correct and unexpired', async () => {
      // Pre-load OTP row matching "123456" (since hashOtp is identity)
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '123456',
        expires_at: future(10),
        attempts: 0,
        resend_count: 0,
        last_sent_at: past(2),
        locked_at: null,
      };
      const res = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '123456' }).expect(200);
      expect(res.body).toMatchObject({
        success: true,
        resetSessionToken: 'rst_MOCK_p1',
        expiresIn: 600,
      });
      // OTP row should be cleared (deleted)
      expect(scenario.otpRow).toBeNull();
    });

    it('400 OTP_INVALID when wrong code; attempts increment; lock applied on reaching 5 (next call shows locked)', async () => {
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '123456',
        expires_at: future(10),
        attempts: 3,
        resend_count: 0,
        last_sent_at: past(2),
        locked_at: null,
      };

      // 4th wrong -> attempts to 4, still 400
      const r1 = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '000000' }).expect(400);
      expect(r1.body).toEqual({ code: 'OTP_INVALID' });
      expect(scenario.otpRow?.attempts).toBe(4);

      // 5th wrong -> route increments to 5 and returns 400 (per current implementation)
      const r2 = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '000000' }).expect(400);
      expect(r2.body).toEqual({ code: 'OTP_INVALID' });
      expect(scenario.otpRow?.attempts).toBe(5);
      expect(scenario.otpRow?.locked_at).not.toBeNull();

      // Next attempt should see locked and return 423
      const r3 = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '000000' }).expect(423);
      expect(r3.body).toEqual({ code: 'OTP_LOCKED' });
    });

    it('400 OTP_EXPIRED when code is past TTL', async () => {
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '123456',
        expires_at: past(1), // expired 1 min ago
        attempts: 0,
        resend_count: 0,
        last_sent_at: past(2),
        locked_at: null,
      };
      const res = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '123456' }).expect(400);
      expect(res.body).toEqual({ code: 'OTP_EXPIRED' });
      // still present (route clears only on success)
      expect(scenario.otpRow).not.toBeNull();
    });

    it('400 VALIDATION_ERROR on bad payload', async () => {
      const res = await request(app).post(VR_ROUTE).send({ email: 'not-an-email', otp: 'xxx' }).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 OTP_INVALID for unknown/non-ACTIVE email (enumeration-safe)', async () => {
      // remove profile
      delete scenario.profilesByEmail['jane@gmail.com'];
      const res = await request(app).post(VR_ROUTE).send({ email: 'jane@gmail.com', otp: '123456' }).expect(400);
      expect(res.body).toEqual({ code: 'OTP_INVALID' });
    });
  });

  // 1.16 – Set New Password (Complete)
  describe('POST /auth/password/reset (1.16)', () => {
    it('200 success updates password and revokes refresh tokens (no login issued)', async () => {
      const body = {
        resetSessionToken: 'rst_MOCK_p1',
        newPassword: 'NewAbcd1234',
        confirmPassword: 'NewAbcd1234',
      };
      const res = await request(app).post(RS_ROUTE).send(body).expect(200);
      expect(res.body).toEqual({ success: true, message: 'Password has been reset' });

      // password hash updated on ACTIVE signup for that profile
      expect(scenario.signupByProfileId['p1']?.password_hash).toBe('HASH(NewAbcd1234)');

      // refresh tokens invalidated for that signup id
      expect(scenario.invalidatedRefresh).toEqual([{ signupId: 's1' }]);
    });

    it('401 RESET_SESSION_INVALID on bad/expired token', async () => {
      const body = {
        resetSessionToken: 'rst_BAD',
        newPassword: 'NewAbcd1234',
        confirmPassword: 'NewAbcd1234',
      };
      const res = await request(app).post(RS_ROUTE).send(body).expect(401);
      expect(res.body).toEqual({ code: 'RESET_SESSION_INVALID' });
    });

    it('400 VALIDATION_ERROR when passwords mismatch', async () => {
      const body = {
        resetSessionToken: 'rst_MOCK_p1',
        newPassword: 'NewAbcd1234',
        confirmPassword: 'Mismatch',
      };
      const res = await request(app).post(RS_ROUTE).send(body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  // 1.18 – Cancel Password Reset
  describe('POST /auth/password/cancel (1.18)', () => {
    it('200 and clears active reset OTP if present', async () => {
      // seed row
      scenario.otpRow = {
        id: 'otp1',
        owner_table: 'profiles',
        owner_id: 'p1',
        purpose: 'RESET_PASSWORD',
        otp_hash: '123456',
        expires_at: future(10),
        attempts: 0,
        resend_count: 0,
        last_sent_at: past(1),
        locked_at: null,
      };
      const res = await request(app).post(CC_ROUTE).send({ email: 'jane@gmail.com' }).expect(200);
      expect(res.body).toEqual({ success: true });
      expect(scenario.otpRow).toBeNull();
    });

    it('200 no-op for unknown email (enumeration-safe)', async () => {
      const res = await request(app).post(CC_ROUTE).send({ email: 'nobody@mail.com' }).expect(200);
      expect(res.body).toEqual({ success: true });
    });

    it('400 VALIDATION_ERROR on bad email', async () => {
      const res = await request(app).post(CC_ROUTE).send({ email: 'bad' }).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
