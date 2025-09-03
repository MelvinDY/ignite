// src/validation/auth.schemas.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  fullName: z.string().min(1),
  zid: z.string().regex(/^z[0-9]{7}$/),
  level: z.enum(['foundation','diploma','undergrad','postgrad','phd']).optional().or(z.string()),
  yearIntake: z.number().int().min(2000).max(2100),
  isIndonesian: z.boolean(),
  program: z.string().min(1),
  major: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((v) => v.password === v.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
