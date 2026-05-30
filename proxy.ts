import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get('admin_auth')
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminCookie || adminCookie.value !== adminPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Handle Supabase auth cookies (fixes Google OAuth PKCE in WebViews)
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  await supabase.auth.getUser()

  // Protect dashboard
  if (pathname.startsWith('/dashboard')) {
    const cookies = request.cookies.getAll()
    const hasSession = cookies.some(c =>
      c.name.includes('supabase') ||
      c.name.includes('sb-') ||
      c.name.includes('campuslink-auth') ||
      c.name.startsWith('sb.')
    )
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
