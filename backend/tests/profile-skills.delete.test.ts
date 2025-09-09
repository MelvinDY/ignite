import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let skillId: number;
let profileSkillExists: boolean;
let deleteError: any;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

const deleteRoute = (id: number) => `/api/profile/skills/${id}`;

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
  skillId = 42;
  profileSkillExists = true;
  deleteError = null;
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'profile_skills') {
          return {
            select: () => ({
              eq: (_col: string, _val: any) => ({
                eq: (_col2: string, _val2: any) => ({
                  maybeSingle: () => profileSkillExists
                    ? { data: { id: skillId }, error: null }
                    : { data: null, error: null }
                })
              })
            }),
            delete: () => ({
              eq: () => ({ error: deleteError })
            })
          };
        }
        return makeSupabaseMock(scenario).from(table);
      }
    }
  }));
  app = await buildApp();
});

describe('DELETE /api/profile/skills/:id', () => {
  it('401: returns NOT_AUTHENTICATED if no Authorization header', async () => {
    const res = await request(app).delete(deleteRoute(skillId));
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401: returns NOT_AUTHENTICATED if JWT is invalid', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });
    const res = await request(app)
      .delete(deleteRoute(skillId))
      .set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('200: returns success if association existed and is deleted', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    profileSkillExists = true;
    const res = await request(app)
      .delete(deleteRoute(skillId))
      .set('Authorization', 'Bearer goodtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('200: returns success if association did not exist (idempotent)', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    profileSkillExists = false;
    const res = await request(app)
      .delete(deleteRoute(skillId))
      .set('Authorization', 'Bearer goodtoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it('500: returns INTERNAL if supabase delete errors', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    profileSkillExists = true;
    deleteError = { message: 'fail' };
    const res = await request(app)
      .delete(deleteRoute(skillId))
      .set('Authorization', 'Bearer goodtoken');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });
});
