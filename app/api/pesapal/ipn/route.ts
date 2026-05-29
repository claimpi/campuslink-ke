import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken, getStatus } from '@/lib/pesapal'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderTrackingId } = body
    if (!orderTrackingId) return NextResponse.json({status:200})

    const token = await getToken()
    const status = await getStatus(token, orderTrackingId)
    if (status.payment_status_description !== 'Completed') return NextResponse.json({status:200})

    const { data: payment } = await sb.from('payment_requests').select('*').eq('order_tracking_id', orderTrackingId).maybeSingle()
    if (!payment || payment.status === 'approved') return NextResponse.json({status:200})

    await sb.from('payment_requests').update({status:'approved'}).eq('order_tracking_id', orderTrackingId)

    // Apply upgrade based on type
    const type = payment.type
    if (type === 'premium') {
      const exp = new Date(); exp.setMonth(exp.getMonth()+1)
      await sb.from('profiles').update({is_premium:true, premium_expires_at:exp.toISOString()}).eq('id', payment.user_id)
    } else if (type === 'featured') {
      await sb.from('profiles').update({is_featured:true}).eq('id', payment.user_id)
    } else if (type === 'top_student') {
      await sb.from('profiles').update({is_top_student:true}).eq('id', payment.user_id)
    } else if (type === 'unlock') {
      // Mark the contact as unlocked for this user
      await sb.from('unlock_requests').upsert({requester_id:payment.user_id, target_id:payment.target_id, status:'approved'})
      // Notify the person whose number was unlocked
      if (payment.target_id) {
        const {data:buyer}=await sb.from('profiles').select('full_name').eq('id',payment.user_id).maybeSingle()
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL||'https://campuslink.co.ke'}/api/push-notify`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({userId:payment.target_id,title:'Someone unlocked your number! 💰',body:`${buyer?.full_name||'A student'} just paid KES 20 to connect with you`,url:'/dashboard'})
        }).catch(()=>{})
      }
    } else if (type && type.startsWith('gift_')) {
      // Gift received - save to gifts table and credit receiver
      if (payment.target_id) {
        const giftType = type.replace('gift_','').charAt(0).toUpperCase() + type.replace('gift_','').slice(1)
        await sb.from('gifts').insert([{
          sender_id: payment.user_id, receiver_id: payment.target_id,
          gift_type: giftType, amount: payment.amount || 0, status: 'completed'
        }])
        // Add to receiver's gift earnings
        const { data: recv } = await sb.from('profiles').select('gift_earnings').eq('id', payment.target_id).maybeSingle()
        const giftAmount = payment.amount || 0
        await sb.from('profiles').update({ gift_earnings: (recv?.gift_earnings||0) + giftAmount }).eq('id', payment.target_id)
        // Notify receiver
        const { data: sender } = await sb.from('profiles').select('full_name').eq('id', payment.user_id).maybeSingle()
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ userId: payment.target_id, title: `You received a ${giftType}!`, body: `${sender?.full_name||'Someone'} sent you a virtual ${giftType}`, url: '/dashboard' })
        }).catch(()=>{})
      }
    } else if (type === 'add_group') {
      // Approve the group listing
      if (payment.group_id) {
        await sb.from('whatsapp_groups').update({payment_status:'approved', is_verified:true}).eq('id', payment.group_id)
      }
    }

    return NextResponse.json({orderNotificationType:'IPNCHANGE', orderTrackingId, status:200})
  } catch (e) {
    return NextResponse.json({status:500})
  }
}

export async function GET() { return NextResponse.json({status:200}) }
