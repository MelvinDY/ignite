// tests/profile-educations.delete.test.ts
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

// In-memory "DB"
type EduRow = {
  id: string;
  profile_id: string;
};

let educations: EduRow[] = [];

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
  educations = [
    { id: '1', profile_id: 'profile-123' },
    { id: '2', profile_id: 'someone-else' },
  ];

  // Reapply jwt mock after reset
  vi.doMock('jsonwebtoken', () => ({
    default: { verify: mockJwtVerify },
    verify: mockJwtVerify,
  }));

  // Supabase mock for educations
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table !== 'educations') {
          // small stub for any accidental other table access
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
            delete: () => ({ eq: () => ({ eq: async () => ({ data: null, error: null }) }) }),
          };
        }

        const api = {
          select: (_cols: string) => ({
            eq: (key: string, val: any) => ({
              maybeSingle: async () => {
                // Handle both raw ID and edu_ prefixed ID
                const cleanId = String(val).replace('edu_', '');
                const row = educations.find(r => r.id === cleanId) || null;
                return { data: row ? { id: row.id, profile_id: row.profile_id } : null, error: null };
              },
            }),
          }),
          delete: () => ({
            eq: (key1: string, val1: any) => ({
              eq: async (key2: string, val2: any) => {
                // Expect chaining: .delete().eq('id', id).eq('profile_id', profileId)
                const cleanId = String(val1).replace('edu_', '');
                const before = educations.length;
                educations = educations.filter(
                  r => !(r.id === cleanId && r.profile_id === String(val2))
                );
                const after = educations.length;
                return { data: before !== after ? { id: cleanId } : null, error: null };
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

const route = '/api/profile/educations';

describe('DELETE /api/profile/educations/:id', () => {
  it('200 success: owned education removed', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });
  
    const res = await request(app)
      .delete(`${route}/1`)
      .set('Authorization', 'Bearer ok');
  
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(educations.some(e => e.id === '1')).toBe(false);
  });

  it('200 idempotent: owned education removed twice', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    let res = await request(app)
      .delete(`${route}/1`)
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    
    res = await request(app)
      .delete(`${route}/1`)
      .set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('401 NOT_AUTHENTICATED: no Authorization header', async () => {

    const res = await request(app)
      .delete(`${route}/1`)

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED: invalid Authorization header', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });

    const res = await request(app)
      .delete(`${route}/1`)
      .set('Authorization', 'Bearer badtoken');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('404 NOT_FOUND: education not owned by user', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'someone-else' });
  
    const res = await request(app)
      .delete(`${route}/1`)
      .set('Authorization', 'Bearer ok');
  
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
  });
});