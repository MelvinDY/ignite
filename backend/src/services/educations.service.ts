import { supabase } from "../lib/supabase";
import { AddEducationInput } from "../validation/profile.schemas";
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