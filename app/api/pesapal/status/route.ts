export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getToken, getStatus } from '@/lib/pesapal'

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('orderTrackingId')
  if (!id) return NextResponse.json({error:'Missing id'},{status:400})
  try {
    const token = await getToken()
    return NextResponse.json(await getStatus(token, id))
  } catch (e:any) {
    return NextResponse.json({error:e.message},{status:500})
  }
}
