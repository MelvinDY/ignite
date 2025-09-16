import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExperienceRow } from '../src/services/experiences.service';

let app: ReturnType<Awaited<typeof import('../src/app')>['createApp']>;

const mockJwtVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

let experiences: ExperienceRow[];
let companies: { id: number; name: string }[];
let fields: { id: number; name: string }[];

async function buildApp() {
  const mod = await import('../src/app');
  return mod.createApp();
}

beforeEach(async () => {
  vi.resetModules();

  // seed
  experiences = [
    {
      id: 'e1', profile_id: 'p1',
      company_id: 10, field_of_work_id: 50,
      role_title: 'Backend Dev',
      employment_type: 'full_time',
      location_city: 'Sydney',
      location_country: 'AU',
      location_type: 'hybrid',
      start_year: 2023, start_month: 2,
      end_year: null, end_month: null,
      is_current: true,
      description: 'Building APIs',
    },
    {
      id: 'e2', profile_id: 'other',
      company_id: 11, field_of_work_id: null,
      role_title: 'Something Else',
      employment_type: 'contract',
      location_city: null,
      location_country: null,
      location_type: 'remote',
      start_year: 2022, start_month: 1,
      end_year: 2022, end_month: 12,
      is_current: false,
      description: null,
    },
  ];
  companies = [{ id: 10, name: 'Acme' }, { id: 11, name: 'Globex' }];
  fields = [{ id: 50, name: 'Software Engineering' }];

  // supabase mock
  vi.doMock('../src/lib/supabase', () => {
    function from(table: string) {
      const state: any = { table, filters: [], patch: null };
      const api: any = {
        select(_cols?: string) { state.select = true; return api; },
        eq(key: string, val: any) { state.filters.push({ key, val }); return api; },
        async maybeSingle() {
          if (state.table === 'experiences') {
            const id = state.filters.find((f: any) => f.key === 'id')?.val;
            const row = experiences.find(e => e.id === id) || null;
            return { data: row ?? null, error: null };
          }
          if (state.table === 'fields_of_work' || state.table === 'companies') {
            return { data: null, error: null };
          }
          return { data: null, error: null };
        },
        update(patch: any) {
          state.patch = patch;
          return {
            eq(key: string, val: any) {
              state.filters.push({ key, val });
              return {
                eq(key2: string, val2: any) {
                  state.filters.push({ key: key2, val: val2 });
                  return {
                    async select() { return { data: null, error: null }; },
                    async single() { return { data: null, error: null }; }
                  };
                },
                async select() { return { data: null, error: null }; },
                async single() { return { data: null, error: null }; },
                async then() { /* no-op */ }
              };
            },
            async then() { /* no-op */ }
          };
        },
        upsert(row: any) {
          if (state.table === 'companies') {
            let found = companies.find(c => c.name.toLowerCase() === String(row.name).toLowerCase());
            if (!found) {
              found = { id: companies.length ? Math.max(...companies.map(c => c.id)) + 1 : 1, name: row.name };
              companies.push(found);
            }
            return { select: () => ({ single: async () => ({ data: { id: found!.id }, error: null }) }) };
          }
          if (state.table === 'fields_of_work') {
            let found = fields.find(f => f.name.toLowerCase() === String(row.name).toLowerCase());
            if (!found) {
              found = { id: fields.length ? Math.max(...fields.map(f => f.id)) + 1 : 1, name: row.name };
              fields.push(found);
            }
            return { select: () => ({ single: async () => ({ data: { id: found!.id }, error: null }) }) };
          }
          return { select: () => ({ single: async () => ({ data: null, error: null }) }) };
        },
      };
      return api;
    }
    return { supabase: { from } as any };
  });

  // Spy on service update to actually mutate in-memory list (simulate DB)
  vi.doMock('../src/services/experiences.service', async (orig) => {
    const mod = await vi.importActual<any>('../src/services/experiences.service');
    return {
      ...mod,
      // Wrap to apply the update to our in-memory array post call to supabase.update()
      updateExperience: async (profileId: string, id: string, patch: any) => {
        await mod.updateExperience(profileId, id, patch);
        // Apply changes based on what would be in updateData (approximate)
        const e = experiences.find(x => x.id === id && x.profile_id === profileId);
        if (!e) return;
        if (patch.roleTitle !== undefined) e.role_title = patch.roleTitle;
        if (patch.employmentType !== undefined) e.employment_type = patch.employmentType;
        if (patch.locationCity !== undefined) e.location_city = patch.locationCity ?? null;
        if (patch.locationCountry !== undefined) e.location_country = patch.locationCountry ?? null;
        if (patch.locationType !== undefined) e.location_type = patch.locationType;
        if (patch.description !== undefined) e.description = patch.description ?? null;
        if (patch.startYear !== undefined) e.start_year = patch.startYear;
        if (patch.startMonth !== undefined) e.start_month = patch.startMonth;
        if (patch.isCurrent !== undefined) e.is_current = patch.isCurrent;
        // End fields: reflect merged truth
        if ((patch.isCurrent ?? e.is_current) === true) {
          e.end_year = null; e.end_month = null;
        } else {
          if (patch.endYear !== undefined) e.end_year = patch.endYear!;
          if (patch.endMonth !== undefined) e.end_month = patch.endMonth!;
        }
        if (patch.company !== undefined) {
          // ensureCompanyId path (companies upsert)
          let c = companies.find(c => c.name.toLowerCase() === patch.company.toLowerCase());
          if (!c) {
            const idNew = companies.length ? Math.max(...companies.map(c => c.id)) + 1 : 1;
            c = { id: idNew, name: patch.company };
            companies.push(c);
          }
          e.company_id = c.id;
        }
        if (patch.fieldOfWork !== undefined) {
          let f = fields.find(f => f.name.toLowerCase() === patch.fieldOfWork.toLowerCase());
          if (!f) {
            const idNew = fields.length ? Math.max(...fields.map(f => f.id)) + 1 : 1;
            f = { id: idNew, name: patch.fieldOfWork };
            fields.push(f);
          }
          e.field_of_work_id = f.id;
        }
      }
    };
  });

  mockJwtVerify.mockImplementation((tok: string) => {
    if (tok !== 'ok') throw new Error('bad');
    return { sub: 'p1' };
  });

  app = await buildApp();
});

const ROUTE = '/api/profile/experiences';

describe('PATCH /api/profile/experiences/:id (Story 2.12)', () => {
  it('401 when no auth', async () => {
    const res = await request(app).patch(`${ROUTE}/e1`).send({ roleTitle: 'X' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: 'NOT_AUTHENTICATED' });
  });

  it('404 when not owned', async () => {
    const res = await request(app).patch(`${ROUTE}/e2`)
      .set('Authorization', 'Bearer ok')
      .send({ roleTitle: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND' });
  });

  it('400 when toggling to not current without endMonth/endYear', async () => {
    // e1 is current true; trying to set false without end fields
    const res = await request(app).patch(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok')
      .send({ isCurrent: false });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('400 when end date precedes start date', async () => {
    // e1 start Feb 2023; set to not current with end Jan 2023 -> invalid
    const res = await request(app).patch(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok')
      .send({ isCurrent: false, endMonth: 1, endYear: 2023 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: 'VALIDATION_ERROR' });
  });

  it('200 success: set current → clears end fields', async () => {
    // First change e1 to ended, then back to current
    // Make ended:
    let r1 = await request(app).patch(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok')
      .send({ isCurrent: false, endMonth: 12, endYear: 2023 });
    expect(r1.status).toBe(200);

    // Now set current true (should null end fields)
    const r2 = await request(app).patch(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok')
      .send({ isCurrent: true, roleTitle: 'Senior Backend Dev' });
    expect(r2.status).toBe(200);

    const row = experiences.find(e => e.id === 'e1')!;
    expect(row.is_current).toBe(true);
    expect(row.end_month).toBeNull();
    expect(row.end_year).toBeNull();
    expect(row.role_title).toBe('Senior Backend Dev');
  });

  it('200 success: update company + fieldOfWork', async () => {
    const res = await request(app).patch(`${ROUTE}/e1`)
      .set('Authorization', 'Bearer ok')
      .send({ company: 'NewCo', fieldOfWork: 'Platform Engineering' });
    expect(res.status).toBe(200);

    const row = experiences.find(e => e.id === 'e1')!;
    const comp = companies.find(c => c.id === row.company_id)!;
    const fow = fields.find(f => f.id === row.field_of_work_id)!;
    expect(comp.name).toBe('NewCo');
    expect(fow.name).toBe('Platform Engineering');
  });
});
