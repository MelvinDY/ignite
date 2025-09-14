import { ExperienceRow } from '../services/experiences.service'

export function pickName(
  rel: ExperienceRow['companies'] | ExperienceRow['fields_of_work']
): string | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0]?.name ?? null : rel.name ?? null;
}