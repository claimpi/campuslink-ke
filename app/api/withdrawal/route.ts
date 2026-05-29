import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, phone, email } = await req.json()
    if (!userId || !amount || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (amount < 200) return NextResponse.json({ error: 'Minimum withdrawal is KES 200' }, { status: 400 })

    // Check user has enough earnings
    const { data: profile } = await sb.from('profiles').select('referral_earnings,gift_earnings,full_name').eq('id', userId).maybeSingle()
    const total = (profile?.referral_earnings||0) + (profile?.gift_earnings||0)
    if (total < amount) return NextResponse.json({ error: 'Insufficient earnings' }, { status: 400 })

    // Save withdrawal request
    await sb.from('withdrawal_requests').insert([{
      user_id: userId, amount, phone, status: 'pending', full_name: profile?.full_name
    }])

    // Notify admin via push (optional)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
