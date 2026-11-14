import 'server-only';
import { createHash } from 'node:crypto';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { getDb } from '@/lib/db';
import { loginSchema } from './validation';
import { verifyPassword } from './password';
import { allowAuthAttempt } from './rate-limit';

export function getAuthOptions(): NextAuthOptions {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('REPLACE-'))
    throw new Error('Configure a strong NEXTAUTH_SECRET.');
  return {
    secret,
    adapter: PrismaAdapter(getDb()),
    session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
    pages: { signIn: '/?account=signin', error: '/?account=signin' },
    providers: [
      CredentialsProvider({
        credentials: {
          email: { type: 'email' },
          password: { type: 'password' },
        },
        async authorize(credentials) {
          try {
            const result = loginSchema.safeParse(credentials);
            if (!result.success) return null;
            const { email, password } = result.data;
            if (!(await allowAuthAttempt(email, 'login'))) return null;
            const user = await getDb().user.findUnique({ where: { email } });
            const matches = await verifyPassword(
              password,
              user?.passwordHash ?? null,
            );
            if (!user || !matches || user.disabledAt) return null;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              sessionVersion: user.sessionVersion,
            };
          } catch {
            // NextAuth v4 exposes authorize errors in its redirect query.
            throw new Error('UNAVAILABLE');
          }
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          token.sessionVersion = user.sessionVersion;
        }
        if (!token.sub) return {};
        const current = await getDb().user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            disabledAt: true,
            sessionVersion: true,
          },
        });
        if (
          !current ||
          current.disabledAt ||
          current.sessionVersion !== token.sessionVersion
        )
          return {};
        token.name = current.name;
        token.email = current.email;
        token.picture = current.image?.startsWith('data:image/webp;base64,')
          ? `/api/account/avatar?v=${createHash('sha256').update(current.image).digest('hex')}`
          : current.image;
        token.role = current.role;
        return token;
      },
      session({ session, token }) {
        session.user = token.sub
          ? {
              id: token.sub,
              name: token.name,
              email: token.email,
              image: token.picture,
              role: token.role ?? 'CUSTOMER',
            }
          : undefined;
        return session;
      },
    },
    logger: {
      error(code) {
        console.error('[auth]', code);
      },
      warn(code) {
        console.warn('[auth]', code);
      },
      debug() {},
    },
  };
}
