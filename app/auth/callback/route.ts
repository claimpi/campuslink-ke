export const dynamic = 'force-dynamic'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/home'
  if (!code) return NextResponse.redirect(new URL('/login', request.url))
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
  const { data: { user }, error } = await sb.auth.exchangeCodeForSession(code)
  if (error || !user) return NextResponse.redirect(new URL('/login', request.url))
  const { data: existing } = await sb.from('profiles').select('id,nickname').eq('id', user.id).maybeSingle()
  if (!existing || !existing.nickname) return NextResponse.redirect(new URL('/onboarding', request.url))
  return NextResponse.redirect(new URL(next, request.url))
}
