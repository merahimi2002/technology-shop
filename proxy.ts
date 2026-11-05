import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL('/fa', request.url));
}
export const config = { matcher: ['/'] };
