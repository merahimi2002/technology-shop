import 'server-only';
import { getServerSession } from 'next-auth';
import { connection } from 'next/server';
import { getAuthOptions } from './options';

export async function getCurrentUser() {
  await connection();
  const session = await getServerSession(getAuthOptions());
  return session?.user ?? null;
}
