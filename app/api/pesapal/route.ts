import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken, registerIPN, submitOrder, AMOUNTS, LABELS } from '@/lib/pesapal'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, userName, phone, paymentType, targetId, groupId } = await req.json()
    if (!userId || !userEmail || !paymentType) return NextResponse.json({error:'Missing fields'},{status:400})

    const amount = AMOUNTS[paymentType]
    if (!amount) return NextResponse.json({error:'Invalid payment type'},{status:400})

    const ref = `CL-${paymentType}-${userId.slice(0,6)}-${Date.now()}`

    // Save payment record
    await sb.from('payment_requests').insert([{
      user_id: userId, type: paymentType, amount, status:'pending', reference: ref,
      ...(targetId&&{target_id:targetId}), ...(groupId&&{group_id:groupId})
    }])

    const token = await getToken()
    let ipnId = process.env.PESAPAL_IPN_ID
    if (!ipnId) ipnId = await registerIPN(token)

    const [firstName, ...rest] = (userName||'Student').split(' ')
    const { redirectUrl, orderTrackingId } = await submitOrder({
      token, ipnId: ipnId!, amount, desc: LABELS[paymentType]||paymentType,
      ref, email: userEmail, phone: phone||'',
      firstName, lastName: rest.join(' ')||'KE'
    })

    await sb.from('payment_requests').update({order_tracking_id: orderTrackingId}).eq('reference', ref)
    return NextResponse.json({ redirectUrl, orderTrackingId, reference: ref })
  } catch (e:any) {
    return NextResponse.json({error:e.message||'Failed'},{status:500})
  }
}
