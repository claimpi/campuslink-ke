import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      const { data: subs } = await sb.from('push_subscriptions').select('user_id,endpoint').limit(10)
      return NextResponse.json({ subscriptions: subs })
    }

    const webpush = require('web-push')
    webpush.setVapidDetails(
      'mailto:admin@campuslink.co.ke',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', userId)
    if (!subs || subs.length === 0) return NextResponse.json({ error: 'No subscription for this user' })

    const results = []
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: 'Test 🔔', body: 'Push notification is working!', url: '/dashboard' })
        )
        results.push({ success: true, endpoint: sub.endpoint.slice(0, 50) })
      } catch (e: any) {
        results.push({ success: false, error: e.message, statusCode: e.statusCode })
      }
    }

    return NextResponse.json({ results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
