import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const { data: subs } = await sb.from('push_subscriptions')
      .select('*').eq('user_id', userId)

    if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

    // Dynamic import to avoid SSR issues
    const webpush = (await import('web-push')).default
    webpush.setVapidDetails(
      'mailto:admin@campuslink.co.ke',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const payload = JSON.stringify({ title, body, url })
    let sent = 0

    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload)
        sent++
      } catch (e: any) {
        if (e.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    return NextResponse.json({ sent })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
