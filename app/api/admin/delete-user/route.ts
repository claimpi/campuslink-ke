import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  // Verify admin cookie
  const adminCookie = req.cookies.get('admin_auth')
  if (!adminCookie || adminCookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Delete profile first
  await sb.from('profiles').delete().eq('id', userId)

  // Delete auth user
  await sb.auth.admin.deleteUser(userId)

  return NextResponse.json({ success: true })
}
