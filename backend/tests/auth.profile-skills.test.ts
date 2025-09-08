import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
const TEST_USER_ID = 'user-123';
const NO_SKILLS_USER_ID = 'user-456';

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // Always mock JWT to return TEST_USER_ID by default
  vi.doMock('jsonwebtoken', () => ({
    verify: () => ({ sub: TEST_USER_ID }),
  }));

  // Mock Supabase for skills
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'profile_skills') {
          return {
            select: (_: string) => ({
              eq: (_col: string, val: string) => ({
                data: val === TEST_USER_ID
                  ? [
                      { skills: { id: 1, name: 'Python' } },
                      { skills: { id: 2, name: 'SQL' } },
                    ]
                  : [],
                error: null,
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
      },
    },
  }));

  // Mock tokens
  vi.doMock('../src/utils/tokens', () => ({
    generateAccessToken: (userId: string) => `token-for-${userId}`,
  }));

  app = await buildApp();
});

describe('GET /profile/skills', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/profile/skills');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('NOT_AUTHENTICATED');
  });

  it('should return 200 and an array of skills for an authenticated user', async () => {
    const res = await request(app)
      .get('/api/profile/skills')
      .set('Authorization', `Bearer token-for-${TEST_USER_ID}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([
      { id: 1, name: 'Python' },
      { id: 2, name: 'SQL' },
    ]);
  });

  it('should return 200 and an empty array if the user has no skills', async () => {
    await vi.resetModules();
    vi.doMock('jsonwebtoken', () => ({
      verify: () => ({ sub: NO_SKILLS_USER_ID }),
    }));
    vi.doMock('../src/lib/supabase', () => ({
      supabase: {
        from: (table: string) => {
          if (table === 'profile_skills') {
            return {
              select: (_: string) => ({
                eq: (_col: string, val: string) => ({
                  data: [],
                  error: null,
                }),
              }),
            };
          }
          return { select: () => ({ eq: () => ({ data: [], error: null }) }) };
        },
      },
    }));
    vi.doMock('../src/utils/tokens', () => ({
      generateAccessToken: (userId: string) => `token-for-${userId}`,
    }));
    const mod = await import('../src/app');
    const appNoSkills = mod.createApp();
    const res = await request(appNoSkills)
      .get('/api/profile/skills')
      .set('Authorization', `Bearer token-for-${NO_SKILLS_USER_ID}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});