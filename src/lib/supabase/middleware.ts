import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // ── Static paths that never need auth checks ───────────
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/admin/login', '/reset-password']
  const isPublicPath = publicPaths.includes(pathname)

  // ── Get user session (required by Supabase SSR) ────────
  const { data: { user } } = await supabase.auth.getUser()

  // ── Not logged in: protect resident & admin routes ─────
  if (!user) {
    const residentPaths = ['/submit-report', '/reports', '/map', '/assistant',
      '/announcements', '/notifications', '/profile', '/dashboard']
    const isResidentRoute = residentPaths.some(p => pathname.startsWith(p))

    if (isResidentRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return supabaseResponse
  }

  // ── User is logged in: do ONE role fetch for all checks ─
  // Only fetch role when we actually need it for routing decisions
  const needsRoleCheck =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname === '/login' ||
    pathname === '/admin/login'

  if (!needsRoleCheck) {
    // No role check needed, return immediately (fast path for most navigation)
    return supabaseResponse
  }

  // Single DB call for role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'resident'
  const isAdminOrStaff = role === 'admin' || role === 'staff'

  // ── Redirect /dashboard: residents → submit-report ─────
  if (pathname.startsWith('/dashboard')) {
    if (!isAdminOrStaff) {
      return NextResponse.redirect(new URL('/submit-report', request.url))
    }
  }

  // ── Admin routes: block residents ──────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!isAdminOrStaff) {
      return NextResponse.redirect(new URL('/submit-report', request.url))
    }
  }

  // ── /login while logged in ─────────────────────────────
  if (pathname === '/login') {
    return NextResponse.redirect(
      new URL(isAdminOrStaff ? '/admin' : '/submit-report', request.url)
    )
  }

  // ── /admin/login while logged in ───────────────────────
  if (pathname === '/admin/login' && isAdminOrStaff) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}
