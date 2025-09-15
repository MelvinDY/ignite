// src/services/experiences.service.ts
import { supabase } from '../lib/supabase';
import { ExperienceObject } from '../types/Experience';
import { pickName } from '../utils/experience';
import { CreateExperienceInput } from '../validation/profile.schemas';
import { ensureCompanyId, ensureFieldOfWorkId } from './lookups.service';

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
export async function getProfileExperiences(
  profileId: string
): Promise<ExperienceObject[]> {
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
    .eq('profile_id', profileId)
    .order('is_current', { ascending: false })
    .order('end_year',   { ascending: false, nullsFirst: false })
    .order('end_month',  { ascending: false, nullsFirst: false })
    .order('start_year', { ascending: false })
    .order('start_month',{ ascending: false });

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
