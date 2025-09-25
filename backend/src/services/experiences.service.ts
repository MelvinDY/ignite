// src/services/experiences.service.ts
import { supabase } from '../lib/supabase';
import { ExperienceObject } from '../types/Experience';
import { pickName, validateMergedDates } from '../utils/experience';
import { CreateExperienceInput, UpdateExperienceInput } from '../validation/profile.schemas';
import { ensureCompanyId, ensureFieldOfWorkId } from './lookups.service';
import { getUserIdFromHandle } from "./profile.service";

export type ExperienceRow = {
  id: string;
  profile_id: string;
  company_id: number | null;
  field_of_work_id: number | null;
  role_title: string;
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

  // Joined lookups (PostgREST relationship names use the auto FK names)
  companies?: { name: string } | { name: string }[] | null;
  fields_of_work?: { name: string } | { name: string }[] | null;
};

/**
 * Return all experiences for a profile, sorted by:
 * is_current DESC,
 * end_year DESC NULLS LAST,
 * end_month DESC NULLS LAST,
 * start_year DESC,
 * start_month DESC.
 */
export async function getProfileExperiences(profileId?: string, handle?: string): Promise<ExperienceObject[]> {
  // Validate that at least one parameter is provided
  if (!profileId && !handle) {
    throw { code: "VALIDATION_ERROR" };
  }

  let givenProfileId: string;
  if (profileId) {
    givenProfileId = profileId;
  } else {
    // handle must exist due to validation above
    // get the user id from handle
    try {
      givenProfileId = await getUserIdFromHandle(handle!);
    } catch (error) {
      // If profile not found by handle, NOT_FOUND
      throw { code: "NOT_FOUND" };
    }
  }

  const { data, error } = await supabase
    .from('experiences')
    .select(`
      id,
      role_title,
      start_month,
      start_year,
      end_month,
      end_year,
      is_current,
      employment_type,
      location_city,
      location_country,
      location_type,
      description,
      companies:companies!experiences_company_id_fkey ( name ),
      fields_of_work:fields_of_work!experiences_field_of_work_id_fkey ( name )
    `)
    .eq('profile_id', givenProfileId)
    .order('is_current', { ascending: false })
    .order('end_year', { ascending: false, nullsFirst: false })
    .order('end_month', { ascending: false, nullsFirst: false })
    .order('start_year', { ascending: false })
    .order('start_month', { ascending: false });

  if (error) throw error;

  return (data as ExperienceRow[]).map((r) => ({
    id: r.id,
    title: r.role_title,
    company: pickName(r.companies),
    fieldOfWork: pickName(r.fields_of_work),
    startMonth: r.start_month,
    startYear: r.start_year,
    endMonth: r.end_month,
    endYear: r.end_year,
    isCurrent: r.is_current,
    employmentType: r.employment_type ?? null,
    locationCity: r.location_city ?? null,
    locationCountry: r.location_country ?? null,
    locationType: r.location_type ?? null,
    description: r.description ?? null,
  }));
}

/**
 * Create a new experience for the given profile.
 * Returns the new experience ID.
 */
export async function createExperience(
  profileId: string,
  input: CreateExperienceInput
): Promise<string> {
  const companyId = await ensureCompanyId(input.company);
  const fieldOfWorkId = await ensureFieldOfWorkId(input.fieldOfWork);

  const payload = {
    profile_id: profileId,
    role_title: input.roleTitle,
    company_id: companyId,
    field_of_work_id: fieldOfWorkId,

    employment_type: input.employmentType ?? null,
    location_city: input.locationCity ?? null,
    location_country: input.locationCountry ?? null,
    location_type: input.locationType ?? null,

    start_year: input.startYear,
    start_month: input.startMonth,
    end_year: input.isCurrent ? null : input.endYear!,
    end_month: input.isCurrent ? null : input.endMonth!,
    is_current: input.isCurrent,

    description: input.description ?? null,
  };

  const { data, error } = await supabase
    .from('experiences')
    .insert(payload)
    .select('id')
    .single<{ id: string }>();

  if (error) throw error;
  return data.id;
}

/**
 * Update one experience owned by this profile (partial update).
 * Throws:
 * - { code: 'NOT_FOUND' } if not owned or missing
 * - { code: 'VALIDATION_ERROR', details? } on date rules
 */
export async function updateExperience(
  profileId: string,
  experienceId: string,
  patch: UpdateExperienceInput
): Promise<void> {
  // 1) Load current row (ownership check)
  const { data: row, error: loadErr } = await supabase
    .from('experiences')
    .select(`
      id, profile_id,
      company_id, field_of_work_id,
      role_title, employment_type,
      location_city, location_country, location_type,
      start_year, start_month,
      end_year, end_month,
      is_current, description
    `)
    .eq('id', experienceId)
    .maybeSingle<ExperienceRow>();

  if (loadErr || !row || row.profile_id !== profileId) {
    const err: any = new Error('NOT_FOUND');
    err.code = 'NOT_FOUND';
    throw err;
  }

  // 2) Merge for date validation
  const wasCurrent = row.is_current;
  const nextIsCurrent = patch.isCurrent ?? wasCurrent;

  let nextStartYear = patch.startYear ?? row.start_year;
  let nextStartMonth = patch.startMonth ?? row.start_month;

  let nextEndYear = patch.endYear ?? row.end_year;
  let nextEndMonth = patch.endMonth ?? row.end_month;

  if (patch.isCurrent === true) {
    nextEndYear = null;
    nextEndMonth = null;
  }

  const merged = {
    isCurrent: nextIsCurrent,
    startYear: nextStartYear,
    startMonth: nextStartMonth,
    endYear: nextEndYear,
    endMonth: nextEndMonth,
  };

  // 3) Date rules
  try {
    validateMergedDates(merged);
  } catch (e: any) {
    const err: any = new Error('VALIDATION_ERROR');
    err.code = 'VALIDATION_ERROR';
    err.details = e?.details;
    throw err;
  }

  // 4) Build update payload (unchanged logic, but use merged truth)
  const updateData: Record<string, any> = {};
  if (patch.roleTitle !== undefined) updateData.role_title = patch.roleTitle;
  if (patch.employmentType !== undefined) updateData.employment_type = patch.employmentType;
  if (patch.locationCity !== undefined) updateData.location_city = patch.locationCity ?? null;
  if (patch.locationCountry !== undefined) updateData.location_country = patch.locationCountry ?? null;
  if (patch.locationType !== undefined) updateData.location_type = patch.locationType;
  if (patch.description !== undefined) updateData.description = patch.description ?? null;

  if (patch.startYear !== undefined) updateData.start_year = nextStartYear;
  if (patch.startMonth !== undefined) updateData.start_month = nextStartMonth;

  // Reflect final truth for end fields
  if (patch.isCurrent !== undefined) updateData.is_current = nextIsCurrent;

  if (nextIsCurrent) {
    updateData.end_year = null;
    updateData.end_month = null;
  } else if (
    patch.endYear !== undefined ||
    patch.endMonth !== undefined ||
    patch.isCurrent !== undefined ||
    patch.startYear !== undefined ||
    patch.startMonth !== undefined
  ) {
    updateData.end_year = merged.endYear;   // validated non-null
    updateData.end_month = merged.endMonth; // validated non-null
  }

  // Lookups
  if (patch.company !== undefined) {
    const companyId = await ensureCompanyId(patch.company);
    updateData.company_id = companyId;
  }
  if (patch.fieldOfWork !== undefined) {
    const fowId = await ensureFieldOfWorkId(patch.fieldOfWork);
    updateData.field_of_work_id = fowId;
  }

  if (Object.keys(updateData).length === 0) {
    // nothing to update
    return;
  }

  // 5) Update the row (ownership re-check in WHERE)
  const { error: updErr } = await supabase
    .from('experiences')
    .update(updateData)
    .eq('id', experienceId)
    .eq('profile_id', profileId);

  if (updErr) throw updErr;
}

/**
 * Delete one experience if owned by the given profileId.
 * Returns:
 * - 'DELETED'   → row existed and belonged to user; now removed
 * - 'NOT_OWNED' → row exists but belongs to someone else
 * - 'NOOP'      → row does not exist
 */
export async function deleteExperience(
  profileId: string,
  experienceId: string
): Promise<'DELETED' | 'NOT_OWNED' | 'NOOP'> {
  // 1) Load ownership
  const { data: row, error: selErr } = await supabase
    .from('experiences')
    .select('id, profile_id')
    .eq('id', experienceId)
    .maybeSingle<{ id: string; profile_id: string }>();

  if (selErr) throw selErr;

  if (!row) return 'NOOP';

  if (row.profile_id !== profileId) {
    return 'NOT_OWNED';
  }

  // 2) Delete (scoped by owner to be safe)
  const { error: delErr } = await supabase
    .from('experiences')
    .delete()
    .eq('id', experienceId)
    .eq('profile_id', profileId);

  if (delErr) throw delErr;

  return 'DELETED';
}
