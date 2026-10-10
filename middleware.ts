import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route protection. When Supabase is configured, /dashboard and /onboarding require a session.
 * In demo mode (no Supabase env vars) the client-side guard in app/dashboard/layout.tsx handles it.
 */
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname, search } = req.nextUrl;
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding');

  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }[]) => {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const signin = req.nextUrl.clone();
    signin.pathname = '/auth/signin';
    signin.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(signin);
  }
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*'],
};
