import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { type Scenario, makeSupabaseMock } from './utils/supabaseMock';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;
let scenario: Scenario;

let lookupCalls: {
  schools: Array<{ name: string; returnId: number }>;
  programs: Array<{ name: string; returnId: number }>;
  majors: Array<{ name: string; returnId: number }>;
} = {
  schools: [],
  programs: [],
  majors: [],
};

let educationUpdates: any[] = [];
let educationSelects: any[] = [];

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
  
  lookupCalls = { schools: [], programs: [], majors: [] };
  educationUpdates = [];
  educationSelects = [];

  // Mock supabase
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'schools') {
          return {
            select: () => ({
              eq: (col: string, val: any) => {
                lookupCalls.schools.push({ name: val, returnId: 1 });
                return { data: [{ id: 1, name: val }], error: null };
              },
              single: () => ({ data: null, error: { code: '23505' } }),
            }),
            insert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = lookupCalls.schools.length;
                  lookupCalls.schools.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = 1;
                  lookupCalls.schools.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
          };
        }
        
        if (table === 'programs') {
          return {
            select: () => ({
              eq: (col: string, val: any) => {
                lookupCalls.programs.push({ name: val, returnId: 2 });
                return { data: [{ id: 2, name: val }], error: null };
              },
              single: () => ({ data: null, error: { code: '23505' } }),
            }),
            insert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = lookupCalls.programs.length + 10;
                  lookupCalls.programs.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = 2;
                  lookupCalls.programs.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
          };
        }
        
        if (table === 'majors') {
          return {
            select: () => ({
              eq: (col: string, val: any) => {
                lookupCalls.majors.push({ name: val, returnId: 3 });
                return { data: [{ id: 3, name: val }], error: null };
              },
              single: () => ({ data: null, error: { code: '23505' } }),
            }),
            insert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = lookupCalls.majors.length + 20;
                  lookupCalls.majors.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any) => ({
              select: () => ({
                single: () => {
                  const id = 3;
                  lookupCalls.majors.push({ name: data.name, returnId: id });
                  return { data: { id, name: data.name }, error: null };
                }
              })
            }),
          };
        }
        
        if (table === 'educations') {
          return {
            select: (fields?: string) => ({
              eq: (col: string, val: any) => {
                if (col === 'id' && val === '123') {
                  educationSelects.push({ id: val, col });
                  return {
                    eq: (col2: string, val2: any) => ({
                      single: () => ({
                        data: { 
                          id: 123, 
                          profile_id: val2, 
                          start_month: 3, 
                          start_year: 2020 
                        }, 
                        error: null 
                      })
                    })
                  };
                }
                if (col === 'id' && val === '456') {
                  educationSelects.push({ id: val, col });
                  return {
                    eq: (col2: string, val2: any) => ({
                      single: () => ({
                        data: null, 
                        error: { code: 'PGRST116' }
                      })
                    })
                  };
                }
                return {
                  eq: () => ({
                    single: () => ({ data: null, error: { code: 'PGRST116' } })
                  })
                };
              }
            }),
            update: (data: any) => ({
              eq: (col: string, val: any) => {
                educationUpdates.push({ data, col, val });
                return {
                  eq: (col2: string, val2: any) => {
                    educationUpdates[educationUpdates.length - 1].profileCol = col2;
                    educationUpdates[educationUpdates.length - 1].profileVal = val2;
                    return { error: null };
                  }
                };
              }
            }),
          };
        }
      }
    }
  }));

  app = await buildApp();
});

describe('PATCH /profile/educations/:id', () => {
  it('200: successfully update education with valid data', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });

    const response = await request(app)
      .patch('/api/profile/educations/edu_123')
      .set('Authorization', 'Bearer valid-token')
      .send({
        school: 'UNSW',
        program: 'Bachelor of Engineering (Hons)',
        major: 'Software Engineering',
        endMonth: 11,
        endYear: 2025
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    // Verify the education was updated with correct data
    expect(educationUpdates[0]).toMatchObject({
      data: {
        school_id: 1,
        program_id: 2,
        major_id: 3,
        end_month: 11,
        end_year: 2025
      },
      col: 'id',
      val: '123',
      profileCol: 'profile_id',
      profileVal: 'user-123'
    });

    // Verify lookups were called
    expect(lookupCalls.schools).toContainEqual({ name: 'UNSW', returnId: 1 });
    expect(lookupCalls.programs).toContainEqual({ name: 'Bachelor of Engineering (Hons)', returnId: 2 });
    expect(lookupCalls.majors).toContainEqual({ name: 'Software Engineering', returnId: 3 });
  });

  it('401 NOT_AUTHENTICATED: no Authorization header', async () => {
    const response = await request(app)
      .patch('/api/profile/educations/edu_123')
      .send({ school: 'UNSW' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED: Authorization header is invalid', async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const response = await request(app)
      .patch('/api/profile/educations/edu_123')
      .set('Authorization', 'Bearer invalid-token')
      .send({ school: 'UNSW' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  
  it('400 VALIDATION_ERROR: end year is before start year', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    
    const response = await request(app)
    .patch('/api/profile/educations/edu_123')
    .set('Authorization', 'Bearer valid-token')
    .send({ 
      endMonth: 2,
      endYear: 2019  // Before start year 2020
    });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 'VALIDATION_ERROR' });
  });
  
  it('400 VALIDATION_ERROR: end month is before start month in same year', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    
    const response = await request(app)
    .patch('/api/profile/educations/edu_123')
    .set('Authorization', 'Bearer valid-token')
    .send({ 
      endMonth: 2, // Before start month 3
      endYear: 2020 // Same as start year
    });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ code: 'VALIDATION_ERROR' });
  });
  
  it('404 NOT_FOUND: when education not found', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-123' });
  
    const response = await request(app)
      .patch('/api/profile/educations/edu_456')
      .set('Authorization', 'Bearer valid-token')
      .send({ school: 'UNSW' });
  
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: 'NOT_FOUND' });
  });
});