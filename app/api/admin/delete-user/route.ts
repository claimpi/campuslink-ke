import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const getSb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function DELETE(req: NextRequest) {
  try {
    // Verify admin cookie
    const adminCookie = req.cookies.get('admin_auth')
    if (!adminCookie || adminCookie.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // Use service role - bypasses ALL RLS
    const sb = getSb()

    // Delete related data first to avoid FK constraints
    await sb.from('payment_requests').delete().eq('user_id', userId)
    await sb.from('unlock_requests').delete().eq('requester_id', userId)
    await sb.from('unlock_requests').delete().eq('target_id', userId)
    await sb.from('referrals').delete().eq('referrer_id', userId)
    await sb.from('referrals').delete().eq('referred_id', userId)

    // Delete profile
    const { error: profileError } = await sb.from('profiles').delete().eq('id', userId)
    if (profileError) {
      console.error('Profile delete error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Delete auth user
    const { error: authError } = await sb.auth.admin.deleteUser(userId)
    if (authError) console.error('Auth delete error:', authError)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Delete error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
