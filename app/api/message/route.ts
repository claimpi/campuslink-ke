import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const FREE_MESSAGES = 10
const COINS_PER_MSG = 5

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, content } = await req.json()
    if (!senderId || !receiverId || !content?.trim())
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: sender } = await sb.from('profiles')
      .select('coins, free_messages_used, full_name').eq('id', senderId).maybeSingle()
    if (!sender) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const freeUsed = sender.free_messages_used || 0
    const isFree = freeUsed < FREE_MESSAGES
    const coins = sender.coins || 0

    if (!isFree && coins < COINS_PER_MSG) {
      return NextResponse.json({ error: 'insufficient_coins', coinsNeeded: COINS_PER_MSG, coinsHave: coins }, { status: 402 })
    }

    // Insert message
    await sb.from('messages').insert([{
      sender_id: senderId, receiver_id: receiverId,
      content: content.trim(),
      is_free: isFree,
      coins_spent: isFree ? 0 : COINS_PER_MSG,
    }])

    if (isFree) {
      await sb.from('profiles').update({ free_messages_used: freeUsed + 1 }).eq('id', senderId)
    } else {
      await sb.from('profiles').update({ coins: coins - COINS_PER_MSG }).eq('id', senderId)
      await sb.from('coin_transactions').insert([{
        user_id: senderId, amount: -COINS_PER_MSG, type: 'message_sent',
        description: `Message to ${receiverId.slice(0,8)}`
      }])
    }

    // Push notify receiver
    const { data: recv } = await sb.from('profiles').select('full_name').eq('id', receiverId).maybeSingle()
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: receiverId, title: `💬 ${sender.full_name || 'Someone'}`, body: content.slice(0, 80), url: `/chat/${senderId}` })
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      isFree,
      freeLeft: isFree ? FREE_MESSAGES - freeUsed - 1 : 0,
      coinsLeft: isFree ? coins : coins - COINS_PER_MSG
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
