import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const GIFTS: Record<string, { emoji: string; coins: number; label: string }> = {
  rose:    { emoji: '🌹', coins: 10,  label: 'Rose' },
  heart:   { emoji: '💝', coins: 20,  label: 'Heart' },
  star:    { emoji: '⭐', coins: 50,  label: 'Star' },
  crown:   { emoji: '👑', coins: 100, label: 'Crown' },
  diamond: { emoji: '💎', coins: 200, label: 'Diamond' },
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, giftType } = await req.json()
    if (!senderId || !receiverId || !giftType || !GIFTS[giftType])
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    if (senderId === receiverId)
      return NextResponse.json({ error: 'Cannot gift yourself' }, { status: 400 })

    const gift = GIFTS[giftType]

    // Check sender coins
    const { data: sender } = await sb.from('profiles').select('coins, full_name').eq('id', senderId).maybeSingle()
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    if ((sender.coins || 0) < gift.coins)
      return NextResponse.json({ error: 'insufficient_coins', coinsNeeded: gift.coins, coinsHave: sender.coins || 0 }, { status: 402 })

    const { data: receiver } = await sb.from('profiles').select('full_name, coins').eq('id', receiverId).maybeSingle()
    if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })

    // Deduct from sender
    try{ await sb.from('profiles').update({ coins: (sender.coins || 0) - gift.coins }).eq('id', senderId)

    // Log gift
    await sb.from('gifts').insert([{
      sender_id: senderId, receiver_id: receiverId,
      gift_type: giftType, amount: gift.coins, status: 'completed'
    }])

    // Log coin transactions
    await sb.from('coin_transactions').insert([
      { user_id: senderId, amount: -gift.coins, type: 'gift_sent', description: `Sent ${gift.emoji} ${gift.label} to ${receiver.full_name}` },
    ])

    // Send a chat message about the gift
    await sb.from('messages').insert([{
      sender_id: senderId, receiver_id: receiverId,
      content: `${gift.emoji} I sent you a ${gift.label} gift! (${gift.coins} coins)`,
      is_free: true, coins_spent: 0
    }])

    // Push notify receiver
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: receiverId,
        title: `${gift.emoji} You received a ${gift.label}!`,
        body: `${sender.full_name} sent you a ${gift.label} gift`,
        url: `/chat/${senderId}`
      })
    }) }catch{}

    return NextResponse.json({
      success: true,
      coinsLeft: (sender.coins || 0) - gift.coins,
      gift: { ...gift, type: giftType }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
