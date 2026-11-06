import 'server-only';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from './options';

export async function getCurrentUser() {
  const session = await getServerSession(getAuthOptions());
  return session?.user ?? null;
}
