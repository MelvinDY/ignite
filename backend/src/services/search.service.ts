import { supabase } from "../lib/supabase";

type SearchParams = {
  q: string;
  cities: string[];
  citizenship: Array<"Citizen" | "Permanent Resident">;
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
  const { q, cities, citizenship, sortBy, page, pageSize } = params;

  // pagination → PostgREST range is 0-indexed, inclusive
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Base select: only the “public view” fields we expose
  let query = supabase
    .from("profiles")
    .select(
      [
        "id",
        "full_name",
        "handle",
        "photo_url",
        "headline",
        "domicile_city",
        "domicile_country",
        "citizenship_status",
      ].join(","),
      { count: "exact" }
    )
    // directory visibility guard (adjust if your policy allows "members")
    .eq("visibility", "public"); // keep it strict per spec’s “public view”

  // q: case-insensitive partial match on full_name
  if (q) {
    // ilike with wildcards → partial, case-insensitive
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

  // Sorting
  const hasQ = Boolean(q);
  const sort = ((): { column: string; ascending: boolean } => {
    if (sortBy === "name_asc" || (!hasQ && sortBy === "relevance"))
      return { column: "full_name", ascending: true };
    if (sortBy === "name_desc") return { column: "full_name", ascending: false };
    // "relevance" w/ q present — simple fallback: name_asc (you can upgrade to pg_trgm later)
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
  // PostgREST OR syntax uses '.' as operator separator; escape with URL encoding
  // We also replace commas which separate conditions.
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
    .select(`
      id,
      name,
      experiences!inner(id)
    `)
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