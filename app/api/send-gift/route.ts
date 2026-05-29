import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, giftType, amount, message } = await req.json()
    if (!senderId || !receiverId || !giftType) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await sb.from('gifts').insert([{ sender_id: senderId, receiver_id: receiverId, gift_type: giftType, amount, message }])

    // Notify receiver
    const { data: sender } = await sb.from('profiles').select('full_name').eq('id', senderId).maybeSingle()
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: receiverId,
        title: `You received a ${giftType}!`,
        body: `${sender?.full_name || 'Someone'} sent you a virtual ${giftType} on CampusLink KE`,
        url: '/dashboard'
      })
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
