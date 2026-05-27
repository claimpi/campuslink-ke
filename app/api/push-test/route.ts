import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const webpush = require('web-push')
    const vapidPublic = process.env.VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: subs, error } = await sb.from('push_subscriptions').select('user_id,endpoint').limit(5)

    return NextResponse.json({
      hasPublicKey: !!vapidPublic,
      hasPrivateKey: !!vapidPrivate,
      publicKeyPreview: vapidPublic?.slice(0,20)+'...',
      subscriptionsCount: subs?.length || 0,
      subscriptionsError: error?.message,
      webpushLoaded: true
    })
  } catch(e: any) {
    return NextResponse.json({ error: e.message })
  }
}
