// POST /api/pesapal/ipn — Pesapal webhook (called automatically after payment)
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPesapalToken, getTransactionStatus } from '@/lib/pesapal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderTrackingId, orderMerchantReference, orderNotificationType } = body

    if (orderNotificationType !== 'IPNCHANGE') {
      return NextResponse.json({ status: 200 })
    }

    // Get transaction status from Pesapal
    const token = await getPesapalToken()
    const status = await getTransactionStatus(token, orderTrackingId)

    if (status.payment_status_description !== 'Completed') {
      return NextResponse.json({ status: 200 })
    }

    // Find payment request
    const { data: payment } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('order_tracking_id', orderTrackingId)
      .single()

    if (!payment || payment.status === 'approved') {
      return NextResponse.json({ status: 200 })
    }

    // Mark payment as approved
    await supabase.from('payment_requests')
      .update({ status: 'approved' })
      .eq('order_tracking_id', orderTrackingId)

    // Upgrade the user profile based on payment type
    const update: Record<string, any> = {}
    if (payment.type === 'premium') {
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)
      update.is_premium = true
      update.premium_expires_at = expiresAt.toISOString()
    }
    if (payment.type === 'featured') update.is_featured = true
    if (payment.type === 'top_student') update.is_top_student = true

    if (Object.keys(update).length > 0) {
      await supabase.from('profiles').update(update).eq('id', payment.user_id)
    }

    console.log(`✅ Payment approved for user ${payment.user_id} - ${payment.type}`)
    return NextResponse.json({ orderNotificationType, orderTrackingId, status: 200 })
  } catch (error) {
    console.error('IPN error:', error)
    return NextResponse.json({ status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Pesapal sometimes sends GET for IPN verification
  return NextResponse.json({ status: 200 })
}
