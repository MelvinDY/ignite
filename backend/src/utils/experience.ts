import { z } from "zod";
import { ExperienceRow } from '../services/experiences.service';

export function pickName(
  rel: ExperienceRow['companies'] | ExperienceRow['fields_of_work']
): string | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0]?.name ?? null : rel.name ?? null;
}

export function validateMergedDates(candidate: {
  isCurrent: boolean;
  startYear: number; startMonth: number;
  endYear: number | null; endMonth: number | null;
}) {
  if (candidate.isCurrent) {
    if (candidate.endYear != null || candidate.endMonth != null) {
      const err: any = new Error('VALIDATION_ERROR');
      err.details = [{ path: ['endYear'], message: 'When isCurrent is true, endMonth/endYear must be omitted' }];
      throw err;
    }
    return;
  }
  // isCurrent = false: must provide both end fields
  if (candidate.endYear == null || candidate.endMonth == null) {
    const err: any = new Error('VALIDATION_ERROR');
    err.details = [{ path: ['endYear'], message: 'endMonth and endYear are required when isCurrent is false' }];
    throw err;
  }
  const startNum = candidate.startYear * 12 + (candidate.startMonth - 1);
  const endNum   = candidate.endYear  * 12 + (candidate.endMonth  - 1);
  if (endNum < startNum) {
    const err: any = new Error('VALIDATION_ERROR');
    err.details = [{ path: ['endYear'], message: 'End date must be same month or after start date' }];
    throw err;
  }
}