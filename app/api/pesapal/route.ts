// POST /api/pesapal — initiate payment
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getPesapalToken, registerIPN, submitOrder, PAYMENT_AMOUNTS, PAYMENT_LABELS, PaymentType } from '@/lib/pesapal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userName, phone, paymentType } = await request.json()

    if (!userId || !userEmail || !paymentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = PAYMENT_AMOUNTS[paymentType as PaymentType]
    const description = PAYMENT_LABELS[paymentType as PaymentType]

    if (!amount) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // Create payment record in DB
    const reference = `CL-${userId.slice(0,8)}-${paymentType}-${Date.now()}`
    await supabase.from('payment_requests').insert([{
      user_id: userId,
      type: paymentType,
      amount,
      status: 'pending',
      reference,
    }])

    // Get Pesapal token
    const token = await getPesapalToken()

    // Get or register IPN
    let ipnId = process.env.PESAPAL_IPN_ID
    if (!ipnId) {
      ipnId = await registerIPN(token)
    }

    // Split name
    const nameParts = (userName || 'CampusLink User').split(' ')
    const firstName = nameParts[0] || 'Student'
    const lastName = nameParts.slice(1).join(' ') || 'KE'

    // Submit order
    const { redirectUrl, orderTrackingId } = await submitOrder({
      token,
      ipnId: ipnId!,
      amount,
      description,
      reference,
      email: userEmail,
      phone: phone || '',
      firstName,
      lastName,
    })

    // Save tracking ID
    await supabase.from('payment_requests')
      .update({ order_tracking_id: orderTrackingId })
      .eq('reference', reference)

    return NextResponse.json({ redirectUrl, orderTrackingId, reference })
  } catch (error: any) {
    console.error('Pesapal error:', error)
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 })
  }
}
