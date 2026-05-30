import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin

  // OAuth error returned
  if (errorParam) {
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorDesc || errorParam)}`)
  }

  // PKCE flow (email magic links, etc.)
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.user) {
      await ensureProfile(data.user)
      return NextResponse.redirect(`${baseUrl}${next}?welcome=true`)
    }
  }

  // Implicit flow — token is in the URL hash (#access_token=...)
  // Browser handles this client-side, so redirect to a client page that processes it
  return NextResponse.redirect(`${baseUrl}/auth/confirm?next=${encodeURIComponent(next)}`)
}

async function ensureProfile(user: any) {
  try {
    const { data: existing } = await sbAdmin
      .from('profiles').select('id').eq('id', user.id).maybeSingle()

    if (!existing) {
      const fullName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'New User'
      const avatarUrl = user.user_metadata?.avatar_url
        || user.user_metadata?.picture
        || null
      const newRefCode = user.id.replace(/-/g, '').substring(0, 8).toUpperCase()

      await sbAdmin.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        referral_code: newRefCode,
        referral_earnings: 0,
      })
    }
  } catch (e) {
    console.error('ensureProfile error:', e)
  }
}
