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

export type HandleInput = z.infer<typeof HandleSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
