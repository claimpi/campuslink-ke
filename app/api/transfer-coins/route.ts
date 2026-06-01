import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { senderId, receiverId, amount, message } = await req.json()
    if (!senderId || !receiverId || !amount || amount < 1)
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    if (senderId === receiverId)
      return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })

    const { data: sender } = await sb.from('profiles').select('coins, full_name').eq('id', senderId).maybeSingle()
    if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 })
    if ((sender.coins || 0) < amount)
      return NextResponse.json({ error: 'insufficient_coins', coinsHave: sender.coins || 0 }, { status: 402 })

    const { data: receiver } = await sb.from('profiles').select('coins, full_name').eq('id', receiverId).maybeSingle()
    if (!receiver) return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })

    // Deduct from sender
    try{ await sb.from('profiles').update({ coins: (sender.coins || 0) - amount }).eq('id', senderId)
    // Credit receiver
    await sb.from('profiles').update({ coins: (receiver.coins || 0) + amount }).eq('id', receiverId)

    // Log transactions
    await sb.from('coin_transactions').insert([
      { user_id: senderId, amount: -amount, type: 'transfer_sent', description: `Sent ${amount} coins to ${receiver.full_name}` },
      { user_id: receiverId, amount: amount, type: 'transfer_received', description: `Received ${amount} coins from ${sender.full_name}` }
    ])

    // Log transfer
    await sb.from('coin_transfers').insert([{ sender_id: senderId, receiver_id: receiverId, amount, message }])

    // Notify receiver
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: receiverId, title: `🪙 ${sender.full_name} sent you ${amount} coins!`, body: message || 'You received coins!', url: `/chat/${senderId}` })
    }) }catch{}

    return NextResponse.json({ success: true, senderCoins: (sender.coins || 0) - amount })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
