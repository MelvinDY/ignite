import { supabase } from "../lib/supabase";

/**
 * Fetch all skills for a given profile (user) ID, sorted alphabetically by name.
 * @param profileId The UUID of the profile/user
 * @returns Array of skills: [{ id, name }]
 */
export async function getProfileSkills(profileId: string): Promise<Array<{ id: number; name: string }>> {
	const { data, error } = await supabase
		.from("profile_skills")
		.select("skill_id, skills(id, name)")
		.eq("profile_id", profileId);
	if (error) throw error;
    
	const skills = (data || [])
		.map((row: any) => row.skills)
		.filter((s: any): s is { id: number; name: string } => !!s)
		.reduce((acc: Record<number, { id: number; name: string }>, skill) => {
			acc[skill.id] = skill;
			return acc;
		}, {});
	return Object.values(skills).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Normalize a skill name (trim, capitalize first letter, rest lowercase)
 */
function normalizeSkillName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').replace(/^./, c => c.toUpperCase()).replace(/(.)(.*)/, (m, a, b) => a.toUpperCase() + b.toLowerCase());
}

/**
 * Add a skill to a user's profile. Idempotent if already linked.
 * @param profileId string
 * @param skillName string
 * @returns { id, name }
 */
export async function addSkillToProfile(profileId: string, skillName: string): Promise<{ id: number; name: string }> {
  const normalized = normalizeSkillName(skillName);
  // 1. Ensure skill exists in skills table
  let skillId: number;
  let skillRow;
  {
    const { data, error } = await supabase
      .from("skills")
      .select("id, name")
      .ilike("name", normalized)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      skillId = data.id;
      skillRow = data;
    } else {
      // Insert new skill
      const { data: inserted, error: insertErr } = await supabase
        .from("skills")
        .insert({ name: normalized })
        .select("id, name")
        .single();
      if (insertErr) throw insertErr;
      skillId = inserted.id;
      skillRow = inserted;
    }
  }
  // 2. Insert into profile_skills (idempotent)
  await supabase
    .from("profile_skills")
    .upsert({ profile_id: profileId, skill_id: skillId }, { onConflict: "profile_id,skill_id" });
  return { id: skillId, name: skillRow.name };
}

/**
 * Remove a skill from a user's profile by skill id. Idempotent: returns true if association existed and was deleted, false if not found (but both are 200 at API layer).
 * @param profileId string
 * @param skillId number
 * @returns boolean (true if deleted, false if not found)
 */
export async function removeSkillFromProfile(profileId: string, skillId: number): Promise<boolean> {
  // Check if the association exists and is owned by the user
  const { data, error } = await supabase
    .from("profile_skills")
    .select("id")
    .eq("profile_id", profileId)
    .eq("skill_id", skillId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    // Not found or not owned, but idempotent: treat as deleted
    return false;
  }
  // Delete the association
  const { error: deleteError } = await supabase
    .from("profile_skills")
    .delete()
    .eq("id", data.id);
  if (deleteError) throw deleteError;
  return true;
}
