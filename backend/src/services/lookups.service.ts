// src/services/lookups.service.ts
import { supabase } from '../lib/supabase';

const clean = (s: string | null | undefined) =>
  (s ?? '').trim().replace(/\s+/g, ' ');

/**
 * Upsert a single-row lookup by name.
 * Assumes a unique constraint on (name) for the given table.
 * Returns the row id.
 */
async function upsertByName(
  table: 'programs' | 'majors' | 'schools' | 'companies' | 'fields_of_work',
  name: string
): Promise<number> {
  const label = clean(name);
  if (!label) throw new Error('EMPTY_LABEL');

  const { data, error } = await supabase
    .from(table)
    .upsert({ name: label }, { onConflict: 'name' })
    .select('id')
    .single<{ id: number }>();

  if (error || !data) throw error ?? new Error('UPSERT_FAILED');
  return data.id;
}

/** Ensure (or create) program by name — returns id or null when no name provided. */
export async function ensureProgramId(name?: string | null): Promise<number | null> {
  const label = clean(name);
  if (!label) return null;
  return upsertByName('programs', label);
}

/** Ensure (or create) major by name — returns id or null when no name provided. */
export async function ensureMajorId(name?: string | null): Promise<number | null> {
  const label = clean(name);
  if (!label) return null;
  return upsertByName('majors', label);
}

/**
 * Ensure (or create) company by name — returns id.
 * Throws if name is empty.
 */
export async function ensureCompanyId(name: string): Promise<number> {
  const label = clean(name);
  if (!label) {
    const err: any = new Error('COMPANY_NAME_REQUIRED');
    err.code = 'COMPANY_NAME_REQUIRED';
    throw err;
  }
  return upsertByName('companies', label);
}

/** Ensure (or create) field of work by name — returns id or null when omitted. */
export async function ensureFieldOfWorkId(name?: string | null): Promise<number | null> {
  const label = clean(name);
  if (!label) return null;
  return upsertByName('fields_of_work', label);
}

export async function ensureSchoolId(name?: string | null) {
  if (!clean(name)) return null;
  return upsertByName('schools', name!);
}
