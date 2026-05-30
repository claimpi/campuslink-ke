import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ ok: false })
    await sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId)
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: false }) }
}
