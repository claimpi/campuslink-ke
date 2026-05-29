import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role to bypass RLS for cross-user updates
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json()
    if (!referralCode || !newUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Find referrer by code
    const { data: referrer } = await sb.from('profiles')
      .select('id, referral_earnings, full_name')
      .eq('referral_code', referralCode.toUpperCase())
      .maybeSingle()

    if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    if (referrer.id === newUserId) return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })

    // Check not already referred
    const { data: existing } = await sb.from('referrals')
      .select('id').eq('referred_id', newUserId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Already referred' }, { status: 400 })

    // Insert referral record
    await sb.from('referrals').insert([{
      referrer_id: referrer.id,
      referred_id: newUserId,
      amount: 20,
      status: 'credited'
    }])

    // Update referrer earnings
    await sb.from('profiles').update({
      referral_earnings: (referrer.referral_earnings || 0) + 20
    }).eq('id', referrer.id)

    // Update new user's referred_by
    await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', newUserId)

    return NextResponse.json({ success: true, referrer: referrer.full_name })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
