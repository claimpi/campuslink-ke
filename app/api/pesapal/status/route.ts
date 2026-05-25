import { NextRequest, NextResponse } from 'next/server'
import { getPesapalToken, getTransactionStatus } from '@/lib/pesapal'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderTrackingId = searchParams.get('orderTrackingId')
  if (!orderTrackingId) return NextResponse.json({ error: 'Missing orderTrackingId' }, { status: 400 })
  try {
    const token = await getPesapalToken()
    const status = await getTransactionStatus(token, orderTrackingId)
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
