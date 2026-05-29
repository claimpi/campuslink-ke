import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// Service role client for crediting referrals
const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

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

    if (!error && data.user) {
      const userId = data.user.id

      // Email is now verified - credit referral if user was referred
      try {
        const { data: profile } = await sbAdmin.from('profiles')
          .select('referred_by, referral_credited')
          .eq('id', userId).maybeSingle()

        if (profile?.referred_by && !profile?.referral_credited) {
          // Credit referrer KES 20
          const { data: referrer } = await sbAdmin.from('profiles')
            .select('referral_earnings').eq('id', profile.referred_by).maybeSingle()

          await sbAdmin.from('profiles').update({
            referral_earnings: (referrer?.referral_earnings || 0) + 20
          }).eq('id', profile.referred_by)

          // Insert referral record
          await sbAdmin.from('referrals').insert([{
            referrer_id: profile.referred_by,
            referred_id: userId,
            amount: 20,
            status: 'credited'
          }]).catch(() => {})

          // Mark as credited so we don't double-credit
          await sbAdmin.from('profiles').update({
            referral_credited: true
          }).eq('id', userId)

          // Notify referrer
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: profile.referred_by,
              title: 'You earned KES 20!',
              body: 'Someone you referred just verified their email on CampusLink KE',
              url: '/dashboard'
            })
          }).catch(() => {})
        }
      } catch (e) {
        console.error('Referral credit error:', e)
      }

      return NextResponse.redirect(`${origin}${next}?welcome=true&verified=true`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=verification_failed`)
}
