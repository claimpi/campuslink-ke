import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

function getSb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSb()
    const { senderId, receiverId } = await req.json()
    if (!senderId || !receiverId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Insert like
    const { error } = await sb.from('likes').insert([{ sender_id: senderId, receiver_id: receiverId }])
    if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })

    // Check if it's a mutual match
    const { data: mutual } = await sb.from('likes')
      .select('id').eq('sender_id', receiverId).eq('receiver_id', senderId).maybeSingle()

    const isMatch = !!mutual

    if (isMatch) {
      // Notify both users
      const { data: sender } = await sb.from('profiles').select('full_name').eq('id', senderId).maybeSingle()
      const { data: receiver } = await sb.from('profiles').select('full_name').eq('id', receiverId).maybeSingle()

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: receiverId, title: 'You have a new match!',
          body: `You and ${sender?.full_name} liked each other. Unlock their WhatsApp now!`, url: `/profile/${senderId}` })
      }).catch(() => {})

      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: senderId, title: 'You have a new match!',
          body: `You and ${receiver?.full_name} liked each other. Unlock their WhatsApp now!`, url: `/profile/${receiverId}` })
      }).catch(() => {})
    } else {
      // Notify receiver of like
      const { data: sender } = await sb.from('profiles').select('full_name').eq('id', senderId).maybeSingle()
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: receiverId, title: `${sender?.full_name} liked you!`,
          body: 'Someone liked your profile on CampusLink KE. Check them out!', url: '/' })
      }).catch(() => {})
    }

    // Save notification
    const { data: sender } = await sb.from('profiles').select('full_name, avatar_url').eq('id', senderId).maybeSingle()
    const notifType = isMatch ? 'match' : 'like'
    const notifTitle = isMatch ? `💞 You matched with ${sender?.full_name || 'someone'}!` : `❤️ ${sender?.full_name || 'Someone'} liked you`
    const notifBody = isMatch ? 'You both liked each other — say hello!' : 'Tap to view their profile'
    try{ await sb.from('notifications').insert([{
      user_id: receiverId, type: notifType, title: notifTitle, body: notifBody,
      from_user_id: senderId, url: `/profile/${senderId}`
    }]) }catch{}

    return NextResponse.json({ success: true, isMatch })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
