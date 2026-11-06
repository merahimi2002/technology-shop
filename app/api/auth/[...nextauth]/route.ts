import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { getAuthOptions } from '@/lib/auth/options';

async function handler(
  request: NextRequest,
  context: RouteContext<'/api/auth/[...nextauth]'>,
) {
  return NextAuth(getAuthOptions())(request, context);
}

export { handler as GET, handler as POST };
