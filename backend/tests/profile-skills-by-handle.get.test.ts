import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let skillsData: any[];
let profileData: any;
let supabaseError: any;
let profileError: any;

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
  await vi.resetModules();
  scenario = {
    adminUserByEmail: null,
    adminListUsers: [],
    activeProfileByEmail: null,
    activeProfileByZid: null,
    pendingByEmail: null,
    pendingByZid: null,
    expiredByZid: null,
    expiredByEmail: null,
    createdSignupId: 'signup-created-1',
    revivedSignupId: 'signup-revived-1',
  };

  skillsData = [
    {
      skill_id: 1,
      skills: { id: 1, name: 'JavaScript' },
    },
    {
      skill_id: 2,
      skills: { id: 2, name: 'Python' },
    },
    {
      skill_id: 3,
      skills: { id: 3, name: 'React' },
    },
  ];

  profileData = {
    id: 'profile-456',
    handle: 'johndoe',
  };

  supabaseError = null;
  profileError = null;

  // Mock supabase for this test
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'profiles') {
          return {
            select: (fields: string) => ({
              eq: (col: string, val: any) => ({
                single: () => ({
                  data: profileError ? null : profileData,
                  error: profileError,
                }),
              }),
            }),
          };
        }
        if (table === 'profile_skills') {
          return {
            select: (fields: string) => ({
              eq: (col: string, val: any) => ({
                data: supabaseError ? null : skillsData,
                error: supabaseError,
              }),
            }),
          };
        }
        // fallback to default mock
        return makeSupabaseMock(scenario).from(table);
      },
    },
  }));

  app = await buildApp();
});

const route = '/api/profile/johndoe/skills';

describe('GET /api/profile/:handle/skills', () => {
  it('401: returns NOT_AUTHENTICATED if no Authorization header', async () => {
    const res = await request(app).get(route);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401: returns NOT_AUTHENTICATED if JWT is invalid', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('200: returns skills for valid handle', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'Python' },
      { id: 3, name: 'React' },
    ]);
  });

  it('200: returns empty array when user has no skills', async () => {
    skillsData = [];
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('200: deduplicates and sorts skills by name', async () => {
    skillsData = [
      { skill_id: 3, skills: { id: 3, name: 'TypeScript' } },
      { skill_id: 1, skills: { id: 1, name: 'JavaScript' } },
      { skill_id: 2, skills: { id: 2, name: 'Node.js' } },
      { skill_id: 1, skills: { id: 1, name: 'JavaScript' } }, // duplicate
      { skill_id: 4, skills: { id: 4, name: 'Python' } },
    ];

    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(200);
    // Should be sorted alphabetically and deduplicated
    expect(res.body).toEqual([
      { id: 1, name: 'JavaScript' },
      { id: 2, name: 'Node.js' },
      { id: 4, name: 'Python' },
      { id: 3, name: 'TypeScript' },
    ]);
  });

  it('400: returns VALIDATION_ERROR for invalid handle format', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const invalidRoute = '/api/profile/a/skills'; // too short
    const res = await request(app)
      .get(invalidRoute)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400: returns VALIDATION_ERROR for handle with invalid characters', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const invalidRoute = '/api/profile/user@invalid!/skills';
    const res = await request(app)
      .get(invalidRoute)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('404: returns NOT_FOUND when profile does not exist for handle', async () => {
    profileError = { message: 'Profile not found' };
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('500: returns INTERNAL when supabase skills query fails', async () => {
    supabaseError = { message: 'Database error' };
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });

  it('200: handles skills with null values gracefully', async () => {
    skillsData = [
      { skill_id: 1, skills: { id: 1, name: 'JavaScript' } },
      { skill_id: 2, skills: null }, // null skill
      { skill_id: 3, skills: { id: 3, name: 'Python' } },
    ];

    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');

    expect(res.status).toBe(200);
    // Should filter out null skills and sort the remaining
    expect(res.body).toEqual([
      { id: 1, name: 'JavaScript' },
      { id: 3, name: 'Python' },
    ]);
  });
});