// src/validation/auth.schemas.ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  fullName: z.string().min(1),
  zid: z.string().regex(/^z[0-9]{7}$/),
  level: z.enum(['foundation', 'diploma', 'undergrad', 'postgrad', 'phd']).optional().or(z.string()),
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

export const VerifyOtpSchema = z.object({
  resumeToken: z.string().min(1),
  otp: z.string().regex(/^[0-9]{6}$/),
});

export const ChangeEmailPreVerifySchema = z.object({
  resumeToken: z.string().min(1),
  newEmail: z.string().email()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type ChangeEmailPreVerifyInput = z.infer<typeof ChangeEmailPreVerifySchema>;