import { z } from "zod";
import { hostIs, HttpsUrl } from "../utils/socialLink.js";

export const HandleSchema = z.object({
  handle: z.string().regex(/^[a-z0-9_.-]{3,30}$/),
});

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  headline: z.string().optional(),
  isIndonesian: z.boolean().optional(),
  program: z.string().min(1).optional(),
  major: z.string().min(1).optional(),
  level: z.enum(['foundation', 'diploma', 'undergrad', 'postgrad', 'phd']).optional(),
  yearStart: z.number().int().min(2000).max(2100).optional(),
  yearGrad: z.number().int().min(2000).max(2100).optional(),
  domicileCity: z.string().optional(),
  domicileCountry: z.string().regex(/^[A-Z]{2}$/).optional(),
  bio: z.string().optional(),
}).refine((data) => {
  // Validate that yearGrad is after yearStart if both are provided
  if (data.yearStart && data.yearGrad && data.yearGrad <= data.yearStart) {
    return false;
  }
  return true;
}, {
  message: "Graduation year must be after start year",
  path: ["yearGrad"]
});

export const SocialLinksSchema = z
  .object({
    linkedin: HttpsUrl.refine(
      u => hostIs(u, ["linkedin.com"]),
      { message: "Must be a linkedin.com URL" }
    ).optional(),
    github: HttpsUrl.refine(
      u => hostIs(u, ["github.com"]),
      { message: "Must be a github.com URL" }
    ).optional(),
    x: HttpsUrl.refine(
      u => hostIs(u, ["x.com", "twitter.com"]),
      { message: "Must be an x.com or twitter.com URL" }
    ).optional(),
    website: HttpsUrl.optional(), // any https URL allowed
  })
  .strict(); // reject unknown keys

export const UpdateSocialLinksSchema = z.object({
  socialLinks: SocialLinksSchema, // allow empty object to "clear" links
});

export const AddEducationSchema = z.object({
  school: z.string().min(1).max(30),
  program: z.string().min(1),
  major: z.string().min(1),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),
  endMonth: z.number().int().min(1).max(12).nullable(),
  endYear: z.number().int().min(1900).max(2100).nullable(),
}).refine((data) => {
  if (data.endMonth !== null && data.endYear === null) return false;
  if (data.endYear !== null && data.endMonth === null) return false;
  return true;
}, {
  message: "If either endMonth or endYear is provided, both must be present",
  path: ["endMonth"]
}).refine((data) => {
  // Validate that endYear is equal or after startYear if both are provided
  if (data.endYear !== null && data.endMonth !== null) {
    // If end year is before start year, invalid
    if (data.endYear < data.startYear) return false;
    // If same year, end month must be >= start month
    if (data.endYear === data.startYear && data.endMonth < data.startMonth) return false;
  }
  return true;
}, {
  message: "End date must be the same as or after start date",
  path: ["endYear"]
});

export const CreateExperienceSchema = z.object({
  roleTitle: z.string().min(1).max(120),
  company: z.string().min(1).max(120),
  fieldOfWork: z.string().min(1).max(120).optional(),

  employmentType: z.enum([
    'full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'freelance'
  ]).optional(),

  locationCity: z.string().optional(),
  locationCountry: z.string().regex(/^[A-Z]{2}$/).optional(), // ISO-3166-1 alpha-2
  locationType: z.enum(['on_site', 'remote', 'hybrid']).optional(),

  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1900).max(2100),

  endMonth: z.number().int().min(1).max(12).nullable().optional(),
  endYear: z.number().int().min(1900).max(2100).nullable().optional(),

  isCurrent: z.boolean(),
  description: z.string().max(2000).optional(),
}).superRefine((v, ctx) => {
  const endProvided = v.endMonth != null || v.endYear != null;

  if (v.isCurrent) {
    if (endProvided) {
      ctx.addIssue({
        code: 'custom',
        message: "When isCurrent is true, endMonth/endYear must be omitted",
        path: ['endMonth']
      });
      ctx.addIssue({
        code: 'custom',
        message: "When isCurrent is true, endMonth/endYear must be omitted",
        path: ['endYear']
      });
    }
    return;
  }

  // isCurrent = false → both endMonth & endYear required
  if (v.endMonth == null || v.endYear == null) {
    if (v.endMonth == null) {
      ctx.addIssue({ code: 'custom', message: "endMonth is required when isCurrent is false", path: ['endMonth'] });
    }
    if (v.endYear == null) {
      ctx.addIssue({ code: 'custom', message: "endYear is required when isCurrent is false", path: ['endYear'] });
    }
    return;
  }

  // chronological check
  const startNum = v.startYear * 12 + (v.startMonth - 1);
  const endNum = v.endYear * 12 + (v.endMonth - 1);
  if (endNum < startNum) {
    ctx.addIssue({
      code: 'custom',
      message: "End date must be same month or after start date",
      path: ['endYear']
    });
  }
});

export type HandleInput = z.infer<typeof HandleSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type SocialLinksInput = z.infer<typeof SocialLinksSchema>;
export type UpdateSocialLinksInput = z.infer<typeof UpdateSocialLinksSchema>;
export type AddEducationInput = z.infer<typeof AddEducationSchema>;
export type CreateExperienceInput = z.infer<typeof CreateExperienceSchema>;