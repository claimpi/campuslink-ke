import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const adminCookie = request.cookies.get('admin_auth')
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminCookie || adminCookie.value !== adminPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect dashboard - check for supabase auth cookie
  if (pathname.startsWith('/dashboard')) {
    const hasSession = request.cookies.getAll().some(c =>
      c.name.includes('supabase') || c.name.includes('sb-')
    )
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/admin'],
}
