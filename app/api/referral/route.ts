import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const REFERRAL_COINS = 50 // coins earned per referral

export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json()
    if (!referralCode || !newUserId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: referrer } = await sb.from('profiles')
      .select('id, coins, full_name').eq('referral_code', referralCode.toUpperCase()).maybeSingle()

    if (!referrer) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
    if (referrer.id === newUserId) return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })

    const { data: existing } = await sb.from('referrals').select('id').eq('referred_id', newUserId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Already referred' }, { status: 400 })

    // Credit coins to referrer
    try{ await sb.from('profiles').update({ coins: (referrer.coins || 0) + REFERRAL_COINS }).eq('id', referrer.id)

    // Log coin transaction
    await sb.from('coin_transactions').insert([{
      user_id: referrer.id, amount: REFERRAL_COINS, type: 'referral',
      description: `Referral bonus — someone joined using your link`
    }])

    // Log referral
    await sb.from('referrals').insert([{
      referrer_id: referrer.id, referred_id: newUserId,
      amount: REFERRAL_COINS, status: 'credited'
    }])

    await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', newUserId)

    // Notify referrer
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: referrer.id, title: `🪙 You earned ${REFERRAL_COINS} coins!`, body: 'Someone joined CampusLink KE using your referral link', url: '/dashboard' })
    }) }catch{}

    return NextResponse.json({ success: true, coinsEarned: REFERRAL_COINS })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
