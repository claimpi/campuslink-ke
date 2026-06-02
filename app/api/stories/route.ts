import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

function getSb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId')
  // Get all active stories with profile info, grouped by user
  const sb = getSb()
  const { data } = await sb.from('stories')
    .select('*, profiles!stories_user_id_fkey(id, full_name, avatar_url, is_premium)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ stories: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSb()
    const { userId, mediaUrl, caption } = await req.json()
    if (!userId || !mediaUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const { data } = await sb.from('stories').insert([{ user_id: userId, media_url: mediaUrl, caption }]).select().maybeSingle()
    return NextResponse.json({ success: true, story: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
