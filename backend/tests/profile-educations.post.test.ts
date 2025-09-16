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

let educationInserts: any[] = [];

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
  educationInserts = [];

  // Mock supabase
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'schools') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                maybeSingle: async () => {
                  const existing = lookupCalls.schools.find(s => s.name === val);
                  if (existing) {
                    return { data: { id: existing.returnId, name: val }, error: null };
                  }
                  return { data: null, error: null };
                }
              })
            }),
            insert: (data: any) => ({
              select: () => ({
                single: async () => {
                  const newId = lookupCalls.schools.length + 1;
                  lookupCalls.schools.push({ name: data.name, returnId: newId });
                  return { data: { id: newId, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any, options?: any) => ({
              select: () => ({
                single: async () => {
                  // Clean name like the service does
                  const cleanName = data.name.trim().replace(/\s+/g, ' ');
                  
                  // Check if already exists (case insensitive)
                  const existing = lookupCalls.schools.find(s => 
                    s.name.toLowerCase() === cleanName.toLowerCase()
                  );
                  
                  if (existing) {
                    return { data: { id: existing.returnId }, error: null };
                  }
                  
                  // Create new entry
                  const newId = lookupCalls.schools.length + 1;
                  lookupCalls.schools.push({ name: cleanName, returnId: newId });
                  return { data: { id: newId }, error: null };
                }
              })
            })
          };
        }
        
        if (table === 'programs') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                maybeSingle: async () => {
                  const existing = lookupCalls.programs.find(p => p.name === val);
                  if (existing) {
                    return { data: { id: existing.returnId, name: val }, error: null };
                  }
                  return { data: null, error: null };
                }
              })
            }),
            insert: (data: any) => ({
              select: () => ({
                single: async () => {
                  const newId = lookupCalls.programs.length + 100;
                  lookupCalls.programs.push({ name: data.name, returnId: newId });
                  return { data: { id: newId, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any, options?: any) => ({
              select: () => ({
                single: async () => {
                  const cleanName = data.name.trim().replace(/\s+/g, ' ');
                  
                  const existing = lookupCalls.programs.find(p => 
                    p.name.toLowerCase() === cleanName.toLowerCase()
                  );
                  
                  if (existing) {
                    return { data: { id: existing.returnId }, error: null };
                  }
                  
                  const newId = lookupCalls.programs.length + 100;
                  lookupCalls.programs.push({ name: cleanName, returnId: newId });
                  return { data: { id: newId }, error: null };
                }
              })
            })
          };
        }
        
        if (table === 'majors') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                maybeSingle: async () => {
                  const existing = lookupCalls.majors.find(m => m.name === val);
                  if (existing) {
                    return { data: { id: existing.returnId, name: val }, error: null };
                  }
                  return { data: null, error: null };
                }
              })
            }),
            insert: (data: any) => ({
              select: () => ({
                single: async () => {
                  const newId = lookupCalls.majors.length + 200;
                  lookupCalls.majors.push({ name: data.name, returnId: newId });
                  return { data: { id: newId, name: data.name }, error: null };
                }
              })
            }),
            upsert: (data: any, options?: any) => ({
              select: () => ({
                single: async () => {
                  const cleanName = data.name.trim().replace(/\s+/g, ' ');
                  
                  const existing = lookupCalls.majors.find(m => 
                    m.name.toLowerCase() === cleanName.toLowerCase()
                  );
                  
                  if (existing) {
                    return { data: { id: existing.returnId }, error: null };
                  }
                  
                  const newId = lookupCalls.majors.length + 200;
                  lookupCalls.majors.push({ name: cleanName, returnId: newId });
                  return { data: { id: newId }, error: null };
                }
              })
            })
          };
        }
        
        if (table === 'educations') {
          return {
            insert: (data: any) => ({
              select: () => ({
                single: async () => {
                  const newId = educationInserts.length + 1;
                  const inserted = { ...data, id: newId };
                  educationInserts.push(inserted);
                  return { data: { id: newId }, error: null };
                }
              })
            })
          };
        }
        
        return makeSupabaseMock(scenario).from(table);
      }
    }
  }));

  app = await buildApp();
});

const route = '/api/profile/educations';

describe('POST /api/profile/educations', () => {
  it('201: creates education successfully', async () => {
      mockJwtVerify.mockReturnValue({ sub: 'user-123' });

      const payload = {
        school: 'University of Melbourne',
        program: 'Master of Computer Science',
        major: 'Machine Learning',
        startMonth: 7,
        startYear: 2020,
        endMonth: 12,
        endYear: 2021
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        success: true,
        id: 'edu_1'
      });

      // Verify data was properly stored
      expect(educationInserts[0]).toMatchObject({
        profile_id: 'user-123',
        school_id: 1,
        program_id: 100,
        major_id: 200,
        start_month: 7,
        start_year: 2020,
        end_month: 12,
        end_year: 2021
    });
  });
  it('401 NOT_AUTHENTICATED: no Authorization header', async () => {
    const payload = {
      school: 'UNSW',
      program: 'Bachelor of Engineering',
      major: 'Software Engineering',
      startMonth: 2,
      startYear: 2022,
      endMonth: null,
      endYear: null
    };

    const res = await request(app)
      .post(route)
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED: invalid header token', async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const payload = {
      school: 'UNSW',
      program: 'Bachelor of Engineering',
      major: 'Software Engineering',
      startMonth: 2,
      startYear: 2022,
      endMonth: null,
      endYear: null
    };

    const res = await request(app)
      .post(route)
      .set('Authorization', 'Bearer invalidtoken')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  describe('Validation Errors', () => {
    beforeEach(() => {
      mockJwtVerify.mockReturnValue({ sub: 'user-123' });
    });

    it('400 VALIDATION_ERROR: school too long (> 30 chars)', async () => {
      const payload = {
        school: 'A'.repeat(31), // 31 characters
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2022,
        endMonth: null,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: invalid startMonth (< 1)', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 0,
        startYear: 2022,
        endMonth: null,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: invalid startMonth (> 12)', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 13,
        startYear: 2022,
        endMonth: null,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: invalid startYear (< 1900)', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 1899,
        endMonth: null,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: invalid startYear (> 2100)', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2101,
        endMonth: null,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: endMonth provided but endYear is null', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2022,
        endMonth: 6,
        endYear: null
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: endYear provided but endMonth is null', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2022,
        endMonth: null,
        endYear: 2024
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: endYear before startYear', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 2,
        startYear: 2022,
        endMonth: 6,
        endYear: 2021
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400 VALIDATION_ERROR: same year but endMonth before startMonth', async () => {
      const payload = {
        school: 'UNSW',
        program: 'Bachelor of Engineering',
        major: 'Software Engineering',
        startMonth: 6,
        startYear: 2022,
        endMonth: 3,
        endYear: 2022
      };

      const res = await request(app)
        .post(route)
        .set('Authorization', 'Bearer validtoken')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});