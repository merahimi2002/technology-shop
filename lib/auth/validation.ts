import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
});
