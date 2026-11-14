import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { abort: true })
  .email()
  .max(254);
const passwordSchema = z.string().min(1, { abort: true }).max(128);
const newPasswordSchema = passwordSchema.min(8);
const nameSchema = z.string().trim().min(1).max(80);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const registerSchema = loginSchema.extend({
  name: nameSchema,
  password: newPasswordSchema,
});

export const profileSchema = z.strictObject({ name: nameSchema });

const passwordFields = z.strictObject({
  currentPassword: passwordSchema,
  newPassword: newPasswordSchema,
  confirmPassword: passwordSchema,
});
const confirmationFields = z.object({
  newPassword: newPasswordSchema,
  confirmPassword: passwordSchema,
});
const replacementFields = z.object({
  currentPassword: passwordSchema,
  newPassword: newPasswordSchema,
});

export const changePasswordSchema = passwordFields
  .refine(
    ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
    {
      path: ['confirmPassword'],
      when: ({ value }) => confirmationFields.safeParse(value).success,
    },
  )
  .refine(
    ({ currentPassword, newPassword }) => currentPassword !== newPassword,
    {
      path: ['newPassword'],
      when: ({ value }) => replacementFields.safeParse(value).success,
    },
  );

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: passwordSchema })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
  });
