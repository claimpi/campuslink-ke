import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'

function getSb() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSb()
    const { profileId, currentViews } = await req.json()
    if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })

    const newViews = (currentViews || 0) + 1

    const { error } = await sb.from('profiles')
      .update({ profile_views: newViews })
      .eq('id', profileId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, views: newViews })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
