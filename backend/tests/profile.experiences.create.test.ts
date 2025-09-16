import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

let lastInserted: any = null;
let returnId = 'exp_456';

beforeEach(async () => {
  vi.resetModules();
  mockJwtVerify.mockReset();
  lastInserted = null;
  returnId = 'exp_456';

  // lookups
  vi.doMock('../src/services/lookups.service', () => ({
    ensureCompanyId: async (name: string) => {
      if (!name) throw new Error('COMPANY_NAME_REQUIRED');
      return 101; // pretend upserted/found
    },
    ensureFieldOfWorkId: async (name?: string) => (name ? 202 : null),
  }));

  // supabase insert mock
  vi.doMock('../src/lib/supabase', () => ({
    supabase: {
      from: (table: string) => {
        if (table === 'experiences') {
          return {
            insert: (payload: any) => ({
              select: (_cols: string) => ({
                single: async () => {
                  lastInserted = payload;
                  return { data: { id: returnId }, error: null };
                },
              }),
            }),
          };
        }
        // default no-op
        return {
          insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        } as any;
      },
    },
  }));

  app = await buildApp();
});

const ROUTE = '/api/profile/experiences';

const validBody = {
  roleTitle: "Backend Developer",
  company: "Techify",
  fieldOfWork: "Software Engineering",
  employmentType: "internship",
  locationCity: "Jakarta",
  locationCountry: "ID",
  locationType: "on_site",
  startMonth: 6,
  startYear: 2022,
  endMonth: 1,
  endYear: 2023,
  isCurrent: false,
  description: "Worked on authentication and session services.",
};

describe('POST /api/profile/experiences (Story 2.11)', () => {
  it('401 NOT_AUTHENTICATED when missing auth', async () => {
    const res = await request(app).post(ROUTE).send(validBody);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('201 success: inserts and returns id', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app)
      .post(ROUTE)
      .set('Authorization', 'Bearer ok')
      .send(validBody)
      .expect(201);

    expect(res.body).toEqual({ success: true, id: 'exp_456' });

    // insertion payload mapping is correct
    expect(lastInserted).toMatchObject({
      profile_id: 'profile-123',
      role_title: 'Backend Developer',
      company_id: 101,
      field_of_work_id: 202,
      employment_type: 'internship',
      location_city: 'Jakarta',
      location_country: 'ID',
      location_type: 'on_site',
      start_year: 2022,
      start_month: 6,
      end_year: 2023,
      end_month: 1,
      is_current: false,
      description: 'Worked on authentication and session services.',
    });
  });

  it('400 when isCurrent=false but endMonth/endYear missing', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const bad = { ...validBody, endMonth: undefined };
    const res = await request(app)
      .post(ROUTE)
      .set('Authorization', 'Bearer ok')
      .send(bad);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 when isCurrent=true but end provided', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const bad = { ...validBody, isCurrent: true }; // keep endMonth/endYear → invalid
    const res = await request(app)
      .post(ROUTE)
      .set('Authorization', 'Bearer ok')
      .send(bad);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 when end earlier than start (by month/year)', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const bad = { ...validBody, startYear: 2023, startMonth: 5, endYear: 2023, endMonth: 4 };
    const res = await request(app)
      .post(ROUTE)
      .set('Authorization', 'Bearer ok')
      .send(bad);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 when invalid locationCountry', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const bad = { ...validBody, locationCountry: 'IDN' }; // 3 chars
    const res = await request(app)
      .post(ROUTE)
      .set('Authorization', 'Bearer ok')
      .send(bad);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });
});
