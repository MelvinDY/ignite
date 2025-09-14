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

// In-memory “DB rows” for the experiences table
type Row = {
  id: string;
  profile_id: string;
  role_title: string;
  company_id: number | null;
  field_of_work_id: number | null;
  employment_type: string | null;
  location_city: string | null;
  location_country: string | null;
  location_type: string | null;
  start_year: number;
  start_month: number;
  end_year: number | null;
  end_month: number | null;
  is_current: boolean;
  description: string | null;
  company_name?: string | null;
  field_of_work_name?: string | null;
};

let rows: Row[] = [];
let errorOnSelect = false;

beforeEach(async () => {
  await vi.resetModules();

  mockJwtVerify.mockReset();
  errorOnSelect = false;

  // Default dataset: 3 rows for profile-123, 1 for someone else
  rows = [
    // current job (should be listed first because is_current DESC)
    {
      id: 'exp_current',
      profile_id: 'profile-123',
      role_title: 'Software Engineer',
      company_id: 1,
      field_of_work_id: 10,
      employment_type: 'Full Time',
      location_city: 'Sydney',
      location_country: 'AU',
      location_type: 'Hybrid',
      start_year: 2023,
      start_month: 2,
      end_year: null,
      end_month: null,
      is_current: true,
      description: 'Backend APIs and auth services.',
      company_name: 'Acme Corp',
      field_of_work_name: 'Software Engineering',
    },
    // ended job with later end date (should come before older ended job)
    {
      id: 'exp_recent_end',
      profile_id: 'profile-123',
      role_title: 'Developer',
      company_id: 2,
      field_of_work_id: 20,
      employment_type: 'Contract',
      location_city: 'Jakarta',
      location_country: 'ID',
      location_type: 'Onsite',
      start_year: 2023,
      start_month: 5,
      end_year: 2024,
      end_month: 6,
      is_current: false,
      description: 'Did things.',
      company_name: 'Bravo Ltd',
      field_of_work_name: 'Web Development',
    },
    // older ended job (end 2021/12)
    {
      id: 'exp_old_end',
      profile_id: 'profile-123',
      role_title: 'Intern',
      company_id: 3,
      field_of_work_id: 30,
      employment_type: 'Internship',
      location_city: 'Bandung',
      location_country: 'ID',
      location_type: 'Onsite',
      start_year: 2021,
      start_month: 6,
      end_year: 2021,
      end_month: 12,
      is_current: false,
      description: 'Learned a lot.',
      company_name: 'Charlie Inc',
      field_of_work_name: 'Data',
    },
    // not my profile
    {
      id: 'exp_other_user',
      profile_id: 'profile-999',
      role_title: 'Elsewhere',
      company_id: 4,
      field_of_work_id: 40,
      employment_type: 'Part Time',
      location_city: 'Perth',
      location_country: 'AU',
      location_type: 'Remote',
      start_year: 2020,
      start_month: 1,
      end_year: 2020,
      end_month: 12,
      is_current: false,
      description: 'Not mine.',
      company_name: 'Omega',
      field_of_work_name: 'Misc',
    },
  ];

  // ------- Supabase mock: from('experiences').select(...).eq(...).order(...)* -------
  vi.doMock('../src/lib/supabase', () => {
    function makeTableApi(table: string) {
      // local state for this query
      const state: { profileId?: string } = {};

      const api: any = {
        select: (_cols: string) => api,
        eq: (col: string, val: any) => {
          if (table === 'experiences' && col === 'profile_id') {
            state.profileId = String(val);
          }
          return api;
        },
        order: (_col: string, _opts?: any) => api, // chainable no-op

        // thenable so `await supabase.from(...).select(...).eq(...).order(...)` resolves here
        then: (resolve: any) => {
          if (errorOnSelect) {
            return resolve({ data: null, error: { code: 'DB_ERR', message: 'boom' } });
          }

          // Filter rows by profile id
          let list = rows.filter(r => r.profile_id === state.profileId);

          // Sort per spec:
          // is_current DESC,
          // end_year DESC NULLS LAST,
          // end_month DESC NULLS LAST,
          // start_year DESC,
          // start_month DESC
          list = list.slice().sort((a, b) => {
            if (a.is_current !== b.is_current) return a.is_current ? -1 : 1; // current first
            const ae = a.end_year, be = b.end_year;
            if (ae == null && be != null) return 1;   // nulls last
            if (ae != null && be == null) return -1;
            if (ae != null && be != null) {
              if (be !== ae) return be - ae;         // desc by end_year
              const am = a.end_month!, bm = b.end_month!;
              if (bm !== am) return bm - am;         // desc by end_month
            }
            if (b.start_year !== a.start_year) return b.start_year - a.start_year; // desc
            return b.start_month - a.start_month;                                   // desc
          });

          // Shape like the service's .select() + joins would return
          const data = list.map(r => ({
            id: r.id,
            role_title: r.role_title,
            start_month: r.start_month,
            start_year: r.start_year,
            end_month: r.end_month,
            end_year: r.end_year,
            is_current: r.is_current,
            employment_type: r.employment_type,
            location_city: r.location_city,
            location_country: r.location_country,
            location_type: r.location_type,
            description: r.description,
            // simulate join rows
            companies: r.company_name ? [{ name: r.company_name }] : null,
            fields_of_work: r.field_of_work_name ? [{ name: r.field_of_work_name }] : null,
          }));

          return resolve({ data, error: null });
        },
      };

      return api;
    }

    return {
      supabase: {
        from: (table: string) => makeTableApi(table),
      },
    };
  });

  // Build app after mocks
  app = await buildApp();
});

const ROUTE = '/api/profile/experiences';

describe('GET /api/profile/experiences (Story 2.10)', () => {
  it('401 NOT_AUTHENTICATED when Authorization header missing', async () => {
    const res = await request(app).get(ROUTE);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('401 NOT_AUTHENTICATED when token invalid', async () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('bad');
    });

    const res = await request(app).get(ROUTE).set('Authorization', 'Bearer bad');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('200 with [] when user has no experiences', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'empty-user' });
    // ensure no rows for empty-user
    rows = rows.filter((r) => r.profile_id !== 'empty-user');

    const res = await request(app).get(ROUTE).set('Authorization', 'Bearer ok');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('200 with only my experiences, sorted correctly', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });

    const res = await request(app).get(ROUTE).set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    // 3 rows for profile-123; ensure order and shape
    expect(res.body.map((x: any) => x.id)).toEqual([
      'exp_current',     // current first
      'exp_recent_end',  // ended 2024/6 next
      'exp_old_end',     // ended 2021/12 last
    ]);

    // spot-check mapping
    expect(res.body[0]).toMatchObject({
      id: 'exp_current',
      title: 'Software Engineer',
      company: 'Acme Corp',
      fieldOfWork: 'Software Engineering',
      startMonth: 2,
      startYear: 2023,
      endMonth: null,
      endYear: null,
      isCurrent: true,
      employmentType: 'Full Time',
      locationCity: 'Sydney',
      locationCountry: 'AU',
      locationType: 'Hybrid',
      description: 'Backend APIs and auth services.',
    });
  });

  it('500 INTERNAL when DB select fails', async () => {
    mockJwtVerify.mockReturnValue({ sub: 'profile-123' });
    errorOnSelect = true;

    const res = await request(app).get(ROUTE).set('Authorization', 'Bearer ok');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ code: 'INTERNAL' });
  });
});
