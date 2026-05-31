import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const COST = 10

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId } = await req.json()
    if (!senderId || !receiverId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (senderId === receiverId) return NextResponse.json({ error: 'Cannot super like yourself' }, { status: 400 })

    // Check already sent
    const { data: existing } = await sb.from('super_likes')
      .select('id').eq('sender_id', senderId).eq('receiver_id', receiverId).maybeSingle()
    if (existing) return NextResponse.json({ error: 'Already super liked' }, { status: 400 })

    // Check coins
    const { data: sender } = await sb.from('profiles').select('coins, full_name').eq('id', senderId).maybeSingle()
    if (!sender) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if ((sender.coins || 0) < COST) return NextResponse.json({ error: 'insufficient_coins', coinsHave: sender.coins || 0 }, { status: 402 })

    // Deduct coins
    await sb.from('profiles').update({ coins: (sender.coins || 0) - COST }).eq('id', senderId)
    await sb.from('coin_transactions').insert([{ user_id: senderId, amount: -COST, type: 'super_like', description: `Super liked a profile` }])

    // Insert super like
    await sb.from('super_likes').insert([{ sender_id: senderId, receiver_id: receiverId, coins_spent: COST }])

    // Also register as a regular like
    try{ await sb.from('likes').upsert([{ sender_id: senderId, receiver_id: receiverId }], { onConflict: 'sender_id,receiver_id' }) }catch{}

    // Notify receiver
    const { data: recv } = await sb.from('profiles').select('full_name').eq('id', receiverId).maybeSingle()
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: receiverId, title: `⭐ ${sender.full_name} Super Liked you!`, body: 'They really like you — send them a message!', url: `/profile/${senderId}` })
    }).catch(() => {})

    return NextResponse.json({ success: true, coinsLeft: (sender.coins || 0) - COST })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
