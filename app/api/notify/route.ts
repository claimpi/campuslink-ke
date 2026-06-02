import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

function getSb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSb()
    const { userId, type, title, body, fromUserId, url } = await req.json()
    if (!userId || !type || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await sb.from('notifications').insert([{
      user_id: userId, type, title, body, from_user_id: fromUserId || null, url: url || '/'
    }])

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
