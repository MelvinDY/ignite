// tests/profile.experiences.delete.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// In-memory "DB"
type ExpRow = {
  id: string;
  profile_id: string;
};

let experiences: ExpRow[] = [];

// jwt.verify mock
const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetModules();
  experiences = [
    { id: 'e1', profile_id: 'profile-123' },
    { id: 'e2', profile_id: 'someone-else' },
  ];

  // Reapply jwt mock after reset
  vi.doMock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
  }));

  // Supabase mock for experiences
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table !== 'experiences') {
          // very small stub for any accidental other table access
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
            delete: () => ({ eq: () => ({ eq: async () => ({ data: null, error: null }) }) }),
          };
        }

        const api = {
          select: (_cols: string) => ({
            eq: (_key: string, val: any) => ({
              maybeSingle: async () => {
                const row = experiences.find(r => r.id === String(val)) || null;
                return { data: row ? { id: row.id, profile_id: row.profile_id } : null, error: null };
              },
            }),
          }),
          delete: () => ({
            eq: (key1: string, val1: any) => ({
              eq: async (key2: string, val2: any) => {
                // Expect chaining: .delete().eq('id', id).eq('profile_id', profileId)
                const before = experiences.length;
                experiences = experiences.filter(
                  r => !(r.id === String(val1) && r.profile_id === String(val2))
                );
                const after = experiences.length;
                // mimic success object
                return { data: before !== after ? { id: String(val1) } : null, error: null };
              },
            }),
          }),
        };
        return api as any;
      },
    },
  }));

  app = await buildApp();
  mockJwtVerify.mockReset();
});

const ROUTE = '/api/profile/experiences';

describe('DELETE /api/profile/experiences/:id (Story 2.13)', () => {
  it('401 when no auth', async () => {
    const res = await request(app).delete(`${ROUTE}/e1`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('404 when not owned', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .delete(`${ROUTE}/e2`)
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
    // confirm still there
    expect(experiences.some(e => e.id === 'e2')).toBe(true);
  });

  it('200 success: owned experience removed', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .delete(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(experiences.some(e => e.id === 'e1')).toBe(false);
  });

  it('200 idempotent: deleting an already-deleted id still returns 200', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });
    // ensure e3 doesn't exist
    experiences = experiences.filter(e => e.id !== 'e3');

    const res = await request(app)
      .delete(`${ROUTE}/e3`)
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('401 when token invalid (jwt.verify throws)', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });

    const res = await request(app)
      .delete(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer nope');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('500 INTERNAL on supabase unexpected error (optional)', async () => {
    // Force the select to throw by swapping the mock for this case
    vi.resetModules();

    // Re-mock jwt
    vi.doMock('jsonwebtoken', () => ({
      default: { verify: () => ({ sub: 'profile-123' }) },
      verify: () => ({ sub: 'profile-123' }),
    }));

    vi.doMock('../src/lib/supabase', () => ({
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: new Error('DB_ERR') }),
            }),
          }),
          delete: () => ({ eq: () => ({ eq: async () => ({ data: null, error: null }) }) }),
        }),
      },
    }));

    app = (await import('../src/app')).createApp();

    const res = await request(app)
      .delete('/api/profile/experiences/e1')
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });
});
