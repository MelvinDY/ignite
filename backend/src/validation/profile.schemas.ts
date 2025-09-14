import { z } from "zod";

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
})

export type HandleInput = z.infer<typeof HandleSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type AddEducationInput = z.infer<typeof AddEducationSchema>;
