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

  // Google returned an error
  if (errorParam) {
    console.error('OAuth error:', errorParam, errorDesc)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorDesc || errorParam)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
  }

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
    console.error('Exchange error:', error.message)
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (!data?.user) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_user`)
  }

  const userId = data.user.id
  const user = data.user

  // Auto-create profile for Google/OAuth users
  try {
    const { data: existingProfile } = await sbAdmin
      .from('profiles').select('id').eq('id', userId).maybeSingle()

    if (!existingProfile) {
      const fullName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'New User'
      const avatarUrl = user.user_metadata?.avatar_url
        || user.user_metadata?.picture
        || null
      const newRefCode = userId.replace(/-/g, '').substring(0, 8).toUpperCase()

      await sbAdmin.from('profiles').insert({
        id: userId,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        referral_code: newRefCode,
        referral_earnings: 0,
      })

      return NextResponse.redirect(`${baseUrl}/dashboard?welcome=true&new=true`)
    }

    // Credit referral if applicable
    const { data: profile } = await sbAdmin.from('profiles')
      .select('referred_by, referral_credited').eq('id', userId).maybeSingle()

    if (profile?.referred_by && !profile?.referral_credited) {
      const { data: referrer } = await sbAdmin.from('profiles')
        .select('referral_earnings').eq('id', profile.referred_by).maybeSingle()
      await sbAdmin.from('profiles').update({
        referral_earnings: (referrer?.referral_earnings || 0) + 20
      }).eq('id', profile.referred_by)
      try {
        await sbAdmin.from('referrals').insert([{
          referrer_id: profile.referred_by, referred_id: userId, amount: 20, status: 'credited'
        }])
      } catch {}
      await sbAdmin.from('profiles').update({ referral_credited: true }).eq('id', userId)
    }
  } catch (e: any) {
    console.error('Profile error:', e?.message)
    // Don't block login even if profile creation fails
  }

  return NextResponse.redirect(`${baseUrl}${next}?welcome=true`)
}
