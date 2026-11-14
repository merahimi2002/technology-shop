import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { abort: true })
  .email()
  .max(254);
const passwordSchema = z.string().min(1, { abort: true }).max(128);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1).max(80),
  password: passwordSchema.min(8),
});

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: passwordSchema })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
  });
