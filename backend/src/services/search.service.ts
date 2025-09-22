import { supabase } from "../lib/supabase";

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

export async function listCities(): Promise<{ name: string }[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('domicile_city')
        .eq('is_indonesian', true)
        .eq('domicile_country', 'ID')
        .eq('status', 'ACTIVE')
        .not('domicile_city', 'is', null)
        .order('domicile_city', { ascending: true });
        
    if (error) throw error;

    const uniqueCities = [...new Set(data.map(row => row.domicile_city))]
        .filter(city => city && city.trim())
        .sort()
        .map(name => ({ name }));

    return uniqueCities;
}