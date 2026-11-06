import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const prefix = 'scrypt$131072$8$1';

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `${prefix}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

export async function verifyPassword(
  password: string,
  encoded: string | null,
): Promise<boolean> {
  const parts = encoded?.split('$');
  const valid = parts?.length === 6 && parts.slice(0, 4).join('$') === prefix;
  const salt = valid ? Buffer.from(parts[4], 'base64url') : Buffer.alloc(16);
  const expected = valid
    ? Buffer.from(parts[5], 'base64url')
    : Buffer.alloc(64);
  // Unknown users perform the same expensive work as known users.
  const actual = await derive(
    password,
    salt.length === 16 ? salt : Buffer.alloc(16),
  );
  return (
    !!valid &&
    salt.length === 16 &&
    expected.length === 64 &&
    timingSafeEqual(actual, expected)
  );
}
