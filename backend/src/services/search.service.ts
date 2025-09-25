import { supabase } from "../lib/supabase";

type SearchParams = {
  q: string;
  cities: string[];
  citizenship: Array<"Citizen" | "Permanent Resident">;
  majors: string[];
  companies: string[];
  workFields: string[];
  sortBy: "relevance" | "name_asc" | "name_desc" | string;
  page: number;
  pageSize: number;
};

type ProfilePublicRow = {
  id: string;
  full_name: string;
  handle: string | null;
  photo_url: string | null;
  headline: string | null;
  domicile_city: string | null;
  domicile_country: string | null;
  citizenship_status: "Citizen" | "Permanent Resident" | null;
};

export async function searchDirectory(params: SearchParams) {
  const { q, cities, citizenship, majors, companies, workFields, sortBy, page, pageSize } = params;

  // pagination → PostgREST range is 0-indexed, inclusive
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Base select: only the “public view” fields we expose
  let query = supabase
    .from("profiles")
    .select(
      `
      id,
      full_name,
      handle,
      photo_url,
      headline,
      domicile_city,
      domicile_country,
      citizenship_status
      `,
      { count: "exact" }
    )
    .eq("visibility", "public");

  // q: case-insensitive partial match on full_name
  if (q) {
    query = query.ilike("full_name", `%${q}%`);
  }

  // cities: OR within list; case-insensitive equality
  if (cities.length > 0) {
    const cityClauses = cities.map((c) => `domicile_city.ilike.${escapeDot(c)}`).join(",");
    query = query.or(cityClauses);

    // enforce Indonesian profiles only
    query = query.eq("domicile_country", "ID").eq("is_indonesian", true);
  }

  // citizenship: exact match on enum values; OR within list
  if (citizenship.length > 0) {
    query = query.in("citizenship_status", citizenship);
  }

  // majors: check both profile.major and educations.major
  if (majors.length > 0) {
    // 1) Resolve major names -> IDs
    const { data: majorRows, error: majorErr } = await supabase
      .from("majors")
      .select("id, name")
      .in("name", majors);
    if (majorErr) throw majorErr;

    const majorIds = (majorRows ?? []).map(r => r.id);
    if (majorIds.length === 0) {
      // None of the provided names exist -> no matches
      return { results: [], total: 0 };
    }

    // 2) Collect profile ids that match either:
    //    a) profiles.major_id IN majorIds
    //    b) educations.major_id IN majorIds  (via educations.profile_id)
    const [byProfileMajor, byEduMajor] = await Promise.all([
      supabase.from("profiles").select("id").in("major_id", majorIds),
      supabase.from("educations").select("profile_id").in("major_id", majorIds),
    ]);

    if (byProfileMajor.error) throw byProfileMajor.error;
    if (byEduMajor.error) throw byEduMajor.error;

    const idsA = (byProfileMajor.data ?? []).map(r => r.id as string);
    const idsB = (byEduMajor.data ?? []).map(r => r.profile_id as string);

    const matchingProfileIds = Array.from(new Set([...idsA, ...idsB]));
    if (matchingProfileIds.length === 0) {
      return { results: [], total: 0 };
    }

    // 3) Constrain the main query to those ids
    query = query.in("id", matchingProfileIds);
  }

  // Companies + Work Fields
  let mustBeProfileIds: string[] | null = null;

  // Companies → IDs → experiences.profile_id
  if (companies.length > 0) {
    const { data: companyRows, error: compErr } = await supabase
      .from("companies")
      .select("id, name")
      .in("name", companies);
    if (compErr) throw compErr;

    const companyIds = (companyRows ?? []).map(r => r.id);
    if (companyIds.length === 0) return { results: [], total: 0 };

    const { data: expByCompany, error: expCompErr } = await supabase
      .from("experiences")
      .select("profile_id")
      .in("company_id", companyIds);
    if (expCompErr) throw expCompErr;

    const ids = Array.from(new Set((expByCompany ?? []).map(r => r.profile_id as string)));
    if (ids.length === 0) return { results: [], total: 0 };

    mustBeProfileIds = ids;
  }

  // WorkFields → IDs → experiences.profile_id
  if (workFields.length > 0) {
    const { data: fieldRows, error: fieldErr } = await supabase
      .from("fields_of_work")
      .select("id, name")
      .in("name", workFields);
    if (fieldErr) throw fieldErr;

    const fieldIds = (fieldRows ?? []).map(r => r.id);
    if (fieldIds.length === 0) return { results: [], total: 0 };

    const { data: expByField, error: expFieldErr } = await supabase
      .from("experiences")
      .select("profile_id")
      .in("field_of_work_id", fieldIds);
    if (expFieldErr) throw expFieldErr;

    const ids = Array.from(new Set((expByField ?? []).map(r => r.profile_id as string)));
    if (ids.length === 0) return { results: [], total: 0 };

    // AND semantics across params → intersect with previous set if present
    mustBeProfileIds = mustBeProfileIds === null
      ? ids
      : mustBeProfileIds.filter(id => ids.includes(id));
    if (mustBeProfileIds.length === 0) return { results: [], total: 0 };
  }

  // Apply the intersection set (if we collected one)
  if (mustBeProfileIds !== null) {
    query = query.in("id", mustBeProfileIds);
  }

  // Sorting
  const hasQ = Boolean(q);
  const sort = ((): { column: string; ascending: boolean } => {
    if (sortBy === "name_asc" || (!hasQ && sortBy === "relevance"))
      return { column: "full_name", ascending: true };
    if (sortBy === "name_desc") return { column: "full_name", ascending: false };
    return { column: "full_name", ascending: true };
  })();
  query = query.order(sort.column, { ascending: sort.ascending });

  // Range + execute
  const { data, error, count } = await query
  .returns<ProfilePublicRow[]>()
  .range(from, to);

  if (error) throw error;

  // Shape to API payload
  const results = (data ?? []).map((row) => ({
    profileId: row.id,
    fullName: row.full_name,
    handle: row.handle,
    photoUrl: row.photo_url,
    headline: row.headline,
    domicileCity: row.domicile_city,
    domicileCountry: row.domicile_country,
    citizenshipStatus: row.citizenship_status,
  }));

  return { results, total: count ?? 0 };
}

// helper to escape dots & commas inside OR clause tokens
function escapeDot(value: string) {
  return encodeURIComponent(value);
}

export async function listMajors(): Promise<{ id: number; name: string }[]> {
    const { data, error } = await supabase
        .from("majors")
        .select("id, name")
        .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
}

/**
 * Fetches a list of distinct companies that have been referenced in user experiences.
 * Supports optional search for typeahead/autocomplete functionality.
 *
 * @param {string} [query] - Optional search string to filter company names.
 * Performs a case-insensitive match on company names.
 * If not provided, returns all companies referenced in experiences.
 * @returns {Promise<{ id: number; name: string }[]>} An array of objects containing company ID and name.
 * Sorted alphabetically, limited to 20 results.
 */
export async function lookupCompanies(query?: string) {
  let builder = supabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (query) {
    builder = builder.ilike("name", `%${query}%`);
  }

  const { data, error } = await builder.limit(20);

  if (error) throw error;

  return data?.map(({ id, name }) => ({ id, name })) || [];
}

export async function listWorkFields(): Promise<{ id: number; name: string }[]> {
    const { data, error } = await supabase
        .from("fields_of_work")
        .select("id, name")
        .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
};

export async function listCities(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('domicile_city')
        .eq('status', 'ACTIVE')
        .not('domicile_city', 'is', null)
        .order('domicile_city', { ascending: true });

    if (error) throw error;

    const uniqueCities = [...new Set(data?.map(row => row.domicile_city) || [])]
        .filter(city => city && city.trim())
        .map(name => ({ id: name!, name: name! }));

    return uniqueCities;
}