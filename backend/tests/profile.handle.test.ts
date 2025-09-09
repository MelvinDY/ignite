import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';


let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let skillExists: boolean;
let skillId: number;
let skillName: string;
let upsertError: any;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

const postRoute = '/api/profile/skills';

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
  skillExists = false;
  skillId = 12;
  skillName = 'Python';
  upsertError = null;
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'skills') {
          return {
            select: () => ({
              ilike: () => ({
                maybeSingle: () => skillExists
                  ? { data: { id: skillId, name: skillName }, error: null }
                  : { data: null, error: null }
              })
            }),
            insert: () => ({
              select: () => ({
                single: () => ({ data: { id: skillId, name: skillName }, error: null })
              })
            })
          };
        }
        if (table === 'profile_skills') {
          return {
            upsert: () => ({ data: {}, error: upsertError })
          };
        }
        return makeSupabaseMock(scenario).from(table);
      }
    }
  }));
  app = await buildApp();
});

describe('POST /api/profile/skills', () => {
  it('401: returns NOT_AUTHENTICATED if no Authorization header', async () => {
    const res = await request(app).post(postRoute).send({ skill: 'Python' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401: returns NOT_AUTHENTICATED if JWT is invalid', async () => {
    mockJwtVerify.mockImplementation(() => { throw new Error('bad token'); });
    const res = await request(app)
      .post(postRoute)
      .set('Authorization', 'Bearer badtoken')
      .send({ skill: 'Python' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('400: returns VALIDATION_ERROR if skill is missing', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .post(postRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR', details: { skill: 'Skill is required' } });
  });

  it('201: adds a new skill to profile', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    skillExists = false;
    const res = await request(app)
      .post(postRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({ skill: 'Python' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, id: 12, name: 'Python' });
  });

  it('201: idempotent if skill already linked', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    skillExists = true;
    const res = await request(app)
      .post(postRoute)
      .set('Authorization', 'Bearer validtoken')
      .send({ skill: 'Python' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, id: 12, name: 'Python' });
  });
});
