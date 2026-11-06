import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/auth/password';
import { loginSchema, registerSchema } from '../lib/auth/validation';

it('normalizes email and rejects weak or unbounded registration input', () => {
  const valid = registerSchema.parse({
    name: ' Test ',
    email: ' User@Example.com ',
    password: 'long test password',
  });
  expect(valid.name).toBe('Test');
  expect(valid.email).toBe('user@example.com');
  expect(
    registerSchema.safeParse({ ...valid, password: 'a'.repeat(7) }).success,
  ).toBe(false);
  expect(
    registerSchema.safeParse({ ...valid, password: 'a'.repeat(8) }).success,
  ).toBe(true);
  expect(
    registerSchema.safeParse({ ...valid, password: 'a'.repeat(129) }).success,
  ).toBe(false);
  expect(
    registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success,
  ).toBe(false);
  expect(
    loginSchema.safeParse({ email: valid.email, password: '' }).success,
  ).toBe(false);
});

it('salts passwords and verifies exact, case-sensitive Unicode credentials', async () => {
  const password = 'رمز آزمایشی Long!';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  expect(first).not.toContain(password);
  expect(first).not.toBe(second);
  expect(await verifyPassword(password, first)).toBe(true);
  expect(await verifyPassword(password.toLowerCase(), first)).toBe(false);
  expect(await verifyPassword(password, null)).toBe(false);
  expect(await verifyPassword(password, 'malformed')).toBe(false);
}, 15_000);
