import { supabase } from '../lib/supabase';

const clean = (s: string | null | undefined) =>
  (s ?? '').trim().replace(/\s+/g, '');

/** Upsert a single-row lookup by case-insensitive name, return its id. */
async function upsertByName(
  table: 'programs' | 'majors',
  name: string
): Promise<number> {
  const label = name.trim().replace(/\s+/g, ' ');
  if (!label) throw new Error('EMPTY_LABEL');

  const { data, error } = await supabase
    .from(table)
    .upsert({ name: label }, { onConflict: 'name' })
    .select('id')
    .single<{ id: number }>();

  if (error || !data) throw error ?? new Error('UPSERT_FAILED');
  return data.id;
}

export async function ensureProgramId(name?: string | null) {
  if (!clean(name)) return null;
  return upsertByName('programs', name!);
}

export async function ensureMajorId(name?: string | null) {
  if (!clean(name)) return null;
  return upsertByName('majors', name!);
}
