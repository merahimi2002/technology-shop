import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { abort: true })
  .email()
  .max(254);
const passwordSchema = z.string().min(1, { abort: true }).max(128);
const nameSchema = z.string().trim().min(1).max(80);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const registerSchema = loginSchema.extend({
  name: nameSchema,
  password: passwordSchema.min(8),
});

export const profileSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  currentPassword: passwordSchema.optional(),
});

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: passwordSchema })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
  });
