import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;
let educationsData: any[];
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
  
  educationsData = [
    {
      id: 'edu-1',
      start_year: 2022,
      start_month: 2,
      end_year: null,
      end_month: null,
      schools: { name: 'UNSW' },
      programs: { name: 'Bachelor of Engineering' },
      majors: { name: 'Software Engineering' },
    },
    {
      id: 'edu-2',
      start_year: 2020,
      start_month: 7,
      end_year: 2021,
      end_month: 12,
      schools: { name: 'University of Melbourne' },
      programs: { name: 'Master of Computer Science' },
      majors: { name: 'Machine Learning' },
    },
    {
      id: 'edu-3',
      start_year: 2018,
      start_month: 3,
      end_year: 2020,
      end_month: 6,
      schools: { name: 'Sydney University' },
      programs: { name: 'Bachelor of Science' },
      majors: { name: 'Computer Science' },
    },
  ];
  
  profileData = {
    id: 'profile-123',
  };
  
  supabaseError = null;
  profileError = null;

  // Custom supabase mock for educations by handle
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
        if (table === 'educations') {
          return {
            select: (fields: string) => ({
              eq: (col: string, val: any) => ({
                order: (field: string, options?: any) => ({
                  order: (field2: string, options2?: any) => ({
                    order: (field3: string, options3?: any) => ({
                      order: (field4: string, options4?: any) => ({
                        data: supabaseError ? null : educationsData,
                        error: supabaseError,
                      }),
                    }),
                  }),
                }),
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

const route = '/api/profile/johndoe/educations';

describe('GET /api/profile/:handle/educations', () => {
  it('200: returns educations for valid handle', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 'edu-1',
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2022,
        endMonth: null,
        endYear: null,
      },
      {
        id: 'edu-2',
        school: 'University of Melbourne',
        program: 'Master of Computer Science',
        major: 'Machine Learning',
        startMonth: 7,
        startYear: 2020,
        endMonth: 12,
        endYear: 2021,
      },
      {
        id: 'edu-3',
        school: 'Sydney University',
        program: 'Bachelor of Science',
        major: 'Computer Science',
        startMonth: 3,
        startYear: 2018,
        endMonth: 6,
        endYear: 2020,
      },
    ]);
  });
  
  it('200: returns empty array when user has no educations', async () => {
    educationsData = [];
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer validtoken');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('404 NOT_FOUND: handle does not exist', async () => {
    profileError = { code: 'PGRST116', message: 'No rows returned' };
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    
    const res = await request(app)
      .get('/api/profile/nonexistentuser/educations')
      .set('Authorization', 'Bearer validtoken');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('401 UNAUTHORIZED: missing authorization header', async () => {
    const res = await request(app).get(route);
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 UNAUTHORIZED: invalid token', async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    const res = await request(app)
      .get(route)
      .set('Authorization', 'Bearer invalidtoken');
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });
});