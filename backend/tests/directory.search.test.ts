import request from "supertest";
import { describe, it, expect, beforeEach, vi } from "vitest";

let app: ReturnType<Awaited<typeof import("../src/app")>["createApp"]>;
const mockJwtVerify = vi.fn();

// ---------- In-memory fixtures the mock will use ----------
let mockProfilesRows: Array<any> = [];
let mockMajorsRows: Array<{ id: number; name: string }> = [];
let mockEducationsRows: Array<{ profile_id: string; major_id: number }> = [];
let mockCompaniesRows: Array<{ id: number; name: string }> = [];
let mockFieldsRows: Array<{ id: number; name: string }> = [];
let mockExperiencesRows: Array<{
  profile_id: string;
  company_id: number | null;
  field_of_work_id: number | null;
}> = [];

// ---------- JWT mock ----------
vi.mock("jsonwebtoken", () => ({
  default: { verify: mockJwtVerify },
  verify: mockJwtVerify,
}));

// ---------- Supabase mock ----------
vi.doMock("../src/lib/supabase", () => {
  const makeBuilder = (table: string) => {
    // --- state for this query chain ---
    let idFilter: string[] | null = null;               // profiles.id IN (...)
    let nameIlike: string | null = null;                // profiles.full_name ILIKE '%...%'
    let cityIlikeList: string[] | null = null;          // from or(domicile_city.ilike.A, ...)
    let eqMap: Record<string, any> = {};                // eq filters (domicile_country, is_indonesian, visibility)
    let citizenshipIn: string[] | null = null;          // citizenship_status IN (...)

    const builder: any = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      returns: vi.fn().mockReturnThis(),

      ilike: vi.fn().mockImplementation((col: string, pattern: string) => {
        if (table === "profiles" && col === "full_name") {
          nameIlike = pattern; // "%Jane%"
        }
        return builder;
      }),

      or: vi.fn().mockImplementation((logic: string) => {
        // Expect: "domicile_city.ilike.Jakarta,domicile_city.ilike.Bandung"
        if (table === "profiles" && logic) {
          const parts = logic.split(",");
          const cities: string[] = [];
          for (const token of parts) {
            const seg = token.trim();
            const prefix = "domicile_city.ilike.";
            if (seg.startsWith(prefix)) {
              const raw = seg.slice(prefix.length);
              cities.push(decodeURIComponent(raw));
            }
          }
          if (cities.length > 0) cityIlikeList = cities;
        }
        return builder;
      }),

      eq: vi.fn().mockImplementation((col: string, val: any) => {
        // Save for later filtering in range()
        eqMap[col] = val;
        return builder;
      }),

      in: vi.fn().mockImplementation((col: string, values: any[]) => {
        // Main directory query uses: profiles.in('id', ids)
        if (table === "profiles" && col === "id") {
          idFilter = Array.isArray(values) ? values : [];
          return builder;
        }

        // When building IDs from profile.major → profiles.in('major_id', ids)
        if (table === "profiles" && col === "major_id") {
          const rows = mockProfilesRows
            .filter(r => values.includes(r.major_id))
            .map(r => ({ id: r.id }));
          return Promise.resolve({ data: rows, error: null });
        }

        // majors.in('name', [...])
        if (table === "majors" && col === "name") {
          const data = mockMajorsRows.filter(m => values.includes(m.name));
          return Promise.resolve({ data, error: null });
        }

        // educations.in('major_id', [...]) → profile_id list
        if (table === "educations" && col === "major_id") {
          const data = mockEducationsRows
            .filter(e => values.includes(e.major_id))
            .map(e => ({ profile_id: e.profile_id }));
          return Promise.resolve({ data, error: null });
        }

        // companies.in('name', [...]) for the prefetch step
        if (table === "companies" && col === "name") {
          const data = mockCompaniesRows.filter(c => values.includes(c.name));
          return Promise.resolve({ data, error: null });
        }

        // fields_of_work.in('name', [...]) for the prefetch step
        if (table === "fields_of_work" && col === "name") {
          const data = mockFieldsRows.filter(f => values.includes(f.name));
          return Promise.resolve({ data, error: null });
        }

        // experiences.in('company_id' | 'field_of_work_id', [...]) → profile_id list
        if (table === "experiences" && (col === "company_id" || col === "field_of_work_id")) {
          const data = mockExperiencesRows
            .filter(x => values.includes(x[col] as number))
            .map(x => ({ profile_id: x.profile_id }));
          return Promise.resolve({ data, error: null });
        }

        // profiles.in('citizenship_status', [...]) — record for later filtering
        if (table === "profiles" && col === "citizenship_status") {
          citizenshipIn = Array.isArray(values) ? values : [];
          return builder;
        }

        return builder;
      }),

      range: vi.fn().mockImplementation((_from: number, _to: number) => {
        // Apply all accumulated filters to mockProfilesRows
        let data = mockProfilesRows.slice();

        // visibility=public (service sets this)
        if (eqMap["visibility"]) {
          data = data.filter(r => r.visibility === eqMap["visibility"]);
        }

        // name ILIKE
        if (nameIlike) {
          const needle = nameIlike.replace(/^%|%$/g, "").toLowerCase();
          data = data.filter(r => (r.full_name ?? "").toLowerCase().includes(needle));
        }

        // cities OR ILIKE list
        if (cityIlikeList && cityIlikeList.length > 0) {
          const lc = cityIlikeList.map(c => c.toLowerCase());
          data = data.filter(r => r.domicile_city && lc.some(c => r.domicile_city!.toLowerCase().includes(c)));
        }

        // eq filters (domicile_country, is_indonesian, etc.)
        Object.entries(eqMap).forEach(([k, v]) => {
          if (k === "visibility") return; // already applied
          data = data.filter(r => r[k] === v);
        });

        // citizenship_status IN (...)
        if (citizenshipIn && citizenshipIn.length > 0) {
          const set = new Set(citizenshipIn);
          data = data.filter(r => set.has(r.citizenship_status));
        }

        // id IN (...)
        if (idFilter) {
          const set = new Set(idFilter);
          data = data.filter(r => set.has(r.id));
        }

        // simple count + full slice (we don't need real pagination slicing for these tests)
        return Promise.resolve({ data, error: null, count: data.length });
      }),
    };

    return builder;
  };

  return {
    supabase: {
      from: (table: string) => makeBuilder(table),
    },
  };
});

// ---------- helper ----------
async function buildApp() {
  const mod = await import("../src/app");
  return mod.createApp();
}

beforeEach(async () => {
  await vi.resetModules();

  // reset mocks
  mockJwtVerify.mockImplementation(() => ({ sub: "user-id" }));

  // default datasets are empty; each test will fill what it needs
  mockProfilesRows = [];
  mockMajorsRows = [];
  mockEducationsRows = [];
  mockCompaniesRows = [];
  mockFieldsRows = [];
  mockExperiencesRows = [];

  app = await buildApp();
});

const route = "/api/directory/search";

/**
 * NOTE about expectations:
 * The search endpoint returns **DirectorySearchResult** (profile core),
 * not raw majors/companies/fields. So we assert on the presence of
 * the expected profile(s) rather than checking "major/company" fields.
 */

describe("GET /api/directory/search", () => {
  it("SUCCESS (200): Filter by name query", async () => {
    mockProfilesRows = [
      {
        id: "p1",
        full_name: "Jane Doe",
        handle: null,
        photo_url: null,
        headline: null,
        domicile_city: "Jakarta",
        domicile_country: "ID",
        citizenship_status: "Citizen",
        visibility: "public",
      },
      {
        id: "p2",
        full_name: "John Smith",
        handle: null,
        photo_url: null,
        headline: null,
        domicile_city: "Bandung",
        domicile_country: "ID",
        citizenship_status: "Citizen",
        visibility: "public",
      },
    ];

    const res = await request(app)
      .get(route)
      .query({ q: "Jane" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([
      expect.objectContaining({ fullName: "Jane Doe" }),
    ]);
  });

  it("SUCCESS (200): Filter by major (profile.major OR education.major)", async () => {
    // majors: SE -> id 1, ME -> id 2
    mockMajorsRows = [
      { id: 1, name: "Software Engineering" },
      { id: 2, name: "Mechanical Engineering" },
    ];

    // Profiles
    mockProfilesRows = [
      {
        id: "pa", full_name: "Alice", handle: null, photo_url: null, headline: null,
        domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public",
        major_id: 1,
      },
      {
        id: "pb", full_name: "Bob", handle: null, photo_url: null, headline: null,
        domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public",
        major_id: 99,
      },
    ];

    mockEducationsRows = [
      { profile_id: "pb", major_id: 1 },
    ];

    const res = await request(app)
      .get(route)
      .query({ major: "Software Engineering" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    const ids = res.body.results.map((r: any) => r.profileId);
    expect(new Set(ids)).toEqual(new Set(["pa", "pb"]));
  });

  it("SUCCESS (200): Filter by companies (via experiences)", async () => {
    mockCompaniesRows = [
      { id: 10, name: "Google" },
      { id: 20, name: "Grab" },
    ];
    mockProfilesRows = [
      { id: "p1", full_name: "Nadia", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public" },
      { id: "p2", full_name: "Rizky", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public" },
    ];
    mockExperiencesRows = [
      { profile_id: "p1", company_id: 10, field_of_work_id: null }, // Google
      { profile_id: "p2", company_id: 20, field_of_work_id: null }, // Grab
    ];

    const res = await request(app)
      .get(route)
      .query({ companies: "Google" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    const names = res.body.results.map((r: any) => r.fullName);
    expect(names).toContain("Nadia");
    expect(names).not.toContain("Rizky");
  });

  it("SUCCESS (200): Filter by workFields (via experiences)", async () => {
    mockFieldsRows = [
      { id: 1, name: "Software Engineering" },
      { id: 2, name: "Data Science" },
    ];
    mockProfilesRows = [
      { id: "p1", full_name: "Intan", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public" },
      { id: "p2", full_name: "Yoga", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public" },
    ];
    mockExperiencesRows = [
      { profile_id: "p1", company_id: null, field_of_work_id: 2 }, // Data Science
      { profile_id: "p2", company_id: null, field_of_work_id: 1 }, // Software Eng
    ];

    const res = await request(app)
      .get(route)
      .query({ workFields: "Data Science" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    const names = res.body.results.map((r: any) => r.fullName);
    expect(names).toContain("Intan");
    expect(names).not.toContain("Yoga");
  });

  it("SUCCESS (200): Filter by cities (Indonesian only)", async () => {
    mockProfilesRows = [
      { id: "p1", full_name: "Dina", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public", is_indonesian: true },
      { id: "p2", full_name: "Maya", handle: null, photo_url: null, headline: null, domicile_city: "Sydney",  domicile_country: "AU", citizenship_status: "Citizen", visibility: "public", is_indonesian: true },
    ];

    const res = await request(app)
      .get(route)
      .query({ cities: "Jakarta" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([
      expect.objectContaining({ fullName: "Dina", domicileCity: "Jakarta" }),
    ]);
  });

  it("SUCCESS (200): Filter by citizenship", async () => {
    mockProfilesRows = [
      { id: "p1", full_name: "Evan", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public" },
      { id: "p2", full_name: "Lia",  handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Permanent Resident", visibility: "public" },
    ];

    const res = await request(app)
      .get(route)
      .query({ citizenship: "Citizen" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    const names = res.body.results.map((r: any) => r.fullName);
    expect(names).toContain("Evan");
    expect(names).not.toContain("Lia");
  });

  it("SUCCESS (200): Combination of filters (major + cities)", async () => {
    mockMajorsRows = [{ id: 1, name: "Software Engineering" }];
    mockProfilesRows = [
      { id: "p1", full_name: "Fiona", handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public", major_id: 1, is_indonesian: true },
      { id: "p2", full_name: "Gani",  handle: null, photo_url: null, headline: null, domicile_city: "Medan",   domicile_country: "ID", citizenship_status: "Citizen", visibility: "public", major_id: 1, is_indonesian: true },
      { id: "p3", full_name: "Hadi",  handle: null, photo_url: null, headline: null, domicile_city: "Jakarta", domicile_country: "ID", citizenship_status: "Citizen", visibility: "public", major_id: 999, is_indonesian: true },
    ];

    const res = await request(app)
      .get(route)
      .query({ major: "Software Engineering", cities: "Jakarta" })
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(200);
    const names = res.body.results.map((r: any) => r.fullName);
    expect(names).toContain("Fiona");
    expect(names).not.toContain("Gani");
    expect(names).not.toContain("Hadi");
  });

  // ---- Error cases ----
  it("ERROR (400): No filters provided", async () => {
    const res = await request(app)
      .get(route)
      .set("Authorization", "Bearer validtoken");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ code: "VALIDATION_ERROR" });
  });

  it("ERROR (401): No token", async () => {
    const res = await request(app).get(route);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });

  it("ERROR (401): Invalid token", async () => {
    mockJwtVerify.mockImplementationOnce(() => {
      throw new Error("Invalid token");
    });

    const res = await request(app)
      .get(route)
      .set("Authorization", "Bearer badtoken");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ code: "NOT_AUTHENTICATED" });
  });
});
