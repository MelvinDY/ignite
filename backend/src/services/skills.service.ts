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