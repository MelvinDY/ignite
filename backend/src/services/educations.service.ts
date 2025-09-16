import { supabase } from "../lib/supabase";
import { AddEducationInput, UpdateEducationInput } from "../validation/profile.schemas";
import { ensureProgramId, ensureMajorId, ensureSchoolId } from "./lookups.service";

export interface Education {
  id: string;
  school: string;
  program: string;
  major: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
}

/**
 * Fetch all educations for a given profile (user) ID.
 * Sorted by: endYear DESC NULLS LAST, endMonth DESC NULLS LAST, startYear DESC, startMonth DESC
 * @param profileId The UUID of the profile/user
 * @returns Array of educations
 */
export async function getProfileEducations(profileId: string): Promise<Education[]> {
  const { data, error } = await supabase
    .from("educations")
    .select(`
      id,
      start_year,
      start_month,
      end_year,
      end_month,
      schools!inner(name),
      programs!inner(name),
      majors!inner(name)
    `)
    .eq("profile_id", profileId)
    .order("end_year", { ascending: false, nullsFirst: false })
    .order("end_month", { ascending: false, nullsFirst: false })
    .order("start_year", { ascending: false })
    .order("start_month", { ascending: false });

  if (error) {
    console.error("getProfileEducations.error", error);
    throw error;
  }

  return (data || []).map((edu: any) => ({
    id: edu.id,
    school: edu.schools?.name || "",
    program: edu.programs?.name || "",
    major: edu.majors?.name || "",
    startMonth: edu.start_month,
    startYear: edu.start_year,
    endMonth: edu.end_month,
    endYear: edu.end_year,
  }));
}

/**
 * Add a new education record to a user's profile.
 * @param profileId The UUID of the profile/user
 * @param eduInput The validated education data
 * @returns The ID of the created education record
 */
export async function addEducationToProfile(profileId: string, eduInput: AddEducationInput): Promise<string> {
  // Ensure school exists (create if needed)
  const schoolId = await ensureSchoolId(eduInput.school);
  
  // Ensure program exists (create if needed)
  const programId = await ensureProgramId(eduInput.program);
  
  // Ensure major exists (create if needed)  
  const majorId = await ensureMajorId(eduInput.major);
  
  // Insert education record
  const { data, error } = await supabase
    .from("educations")
    .insert({
      profile_id: profileId,
      school_id: schoolId,
      program_id: programId,
      major_id: majorId,
      start_month: eduInput.startMonth,
      start_year: eduInput.startYear,
      end_month: eduInput.endMonth,
      end_year: eduInput.endYear,
    })
    .select("id")
    .single();

  if (error) {
    console.error("addEducationToProfile.error", error);
    throw error;
  }

  return `edu_${data.id}`;
}

export async function updateProfileEducation(profileId: string, eduId: string, updates: UpdateEducationInput): Promise<void> {
  // First, check if the education exists and belongs to the user
  const { data: existingEducation, error: fetchError } = await supabase
    .from('educations')
    .select('id, profile_id, start_month, start_year')
    .eq('id', eduId.replace('edu_', ''))
    .eq('profile_id', profileId)
    .single();

  if (fetchError || !existingEducation) {
    throw { code: "NOT_FOUND" };
  }

  // Validate date logic if endMonth/endYear are being updated
  if ((updates.endMonth !== undefined || updates.endYear !== undefined) && 
      updates.endMonth !== null && updates.endYear !== null) {
    const startYear = existingEducation.start_year;
    const startMonth = existingEducation.start_month;
    
    // If end year is before start year, invalid
    if (updates.endYear !== undefined && updates.endYear < startYear) {
      throw { code: "VALIDATION_ERROR" };
    }
    // If same year, end month must be >= start month
    if (updates.endYear !== undefined && updates.endMonth !== undefined && 
        updates.endYear === startYear && updates.endMonth < startMonth) {
      throw { code: "VALIDATION_ERROR" };
    }
  }

  // Build the update object
  const updateData: Record<string, any> = {};

  if (updates.school !== undefined) {
    // Lookup school (create if needed)
    const schoolId = await ensureSchoolId(updates.school);
    if (schoolId !== null) updateData.school_id = schoolId;
  }

  if (updates.program !== undefined) {
    // Lookup program (create if needed)
    const programId = await ensureProgramId(updates.program);
    if (programId !== null) updateData.program_id = programId;
  }

  if (updates.major !== undefined) {
    // Lookup major (create if needed)
    const majorId = await ensureMajorId(updates.major);
    if (majorId !== null) updateData.major_id = majorId;
  }

  if (updates.endYear !== undefined) updateData.end_year = updates.endYear;
  if (updates.endMonth !== undefined) updateData.end_month = updates.endMonth;

  // Only proceed if there are updates to apply
  if (Object.keys(updateData).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('educations')
    .update(updateData)
    .eq('id', eduId.replace('edu_', ''))
    .eq('profile_id', profileId);

  if (error) throw error;
}

/**
 * Delete one education if owned by the given profileId.
 * Returns:
 * - 'DELETED'   → row existed and belonged to user; now removed
 * - 'NOT_OWNED' → row exists but belongs to someone else
 * - 'NOOP'      → row does not exist
 */
export async function deleteEducation(
  profileId: string,
  eduId: string
): Promise<'DELETED' | 'NOT_OWNED' | 'NOOP'> {
  // 1) Load ownership
  const { data: row, error: selErr } = await supabase
    .from('educations')
    .select('id, profile_id')
    .eq('id', eduId)
    .maybeSingle<{ id: string; profile_id: string }>();

  if (selErr) throw selErr;

  if (!row) return 'NOOP';

  if (row.profile_id !== profileId) {
    return 'NOT_OWNED';
  }

  // 2) Delete (scoped by owner to be safe)
  const { error: delErr } = await supabase
    .from('educations')
    .delete()
    .eq('id', eduId)
    .eq('profile_id', profileId);

  if (delErr) throw delErr;

  return 'DELETED';
}
