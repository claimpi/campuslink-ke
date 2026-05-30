import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken, COIN_AMOUNTS } from '@/lib/pesapal'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function getStatus(token:string, id:string){
  const res=await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${id}`,
    {headers:{'Authorization':`Bearer ${token}`,'Accept':'application/json'}})
  return res.json()
}

export async function GET(req: NextRequest) {
  try {
    const {searchParams}=new URL(req.url)
    const orderTrackingId=searchParams.get('OrderTrackingId')
    if(!orderTrackingId) return NextResponse.json({status:200})
    const token=await getToken()
    const status=await getStatus(token,orderTrackingId)
    if(status.payment_status_description!=='Completed') return NextResponse.json({status:200})
    await processPayment(orderTrackingId)
    return NextResponse.json({orderNotificationType:'IPNCHANGE',orderTrackingId,status:200})
  } catch(e){ return NextResponse.json({status:500}) }
}

export async function POST(req: NextRequest) {
  try {
    const body=await req.json()
    const {orderTrackingId}=body
    if(!orderTrackingId) return NextResponse.json({status:200})
    const token=await getToken()
    const status=await getStatus(token,orderTrackingId)
    if(status.payment_status_description!=='Completed') return NextResponse.json({status:200})
    await processPayment(orderTrackingId)
    return NextResponse.json({orderNotificationType:'IPNCHANGE',orderTrackingId,status:200})
  } catch(e){ return NextResponse.json({status:500}) }
}

async function processPayment(orderTrackingId:string){
  const {data:payment}=await sb.from('payment_requests').select('*').eq('order_tracking_id',orderTrackingId).maybeSingle()
  if(!payment||payment.status==='approved') return
  await sb.from('payment_requests').update({status:'approved'}).eq('order_tracking_id',orderTrackingId)

  const type=payment.type
  const uid=payment.user_id

  // --- Coin packages ---
  if(type&&COIN_AMOUNTS[type]){
    const coins=COIN_AMOUNTS[type]
    const {data:p}=await sb.from('profiles').select('coins').eq('id',uid).maybeSingle()
    await sb.from('profiles').update({coins:(p?.coins||0)+coins}).eq('id',uid)
    await sb.from('coin_transactions').insert([{user_id:uid,amount:coins,type:'purchase',description:`Bought ${coins} coins`,ref:payment.reference}])
    notify(uid,'🪙 Coins added!',`${coins} coins have been added to your wallet`,'/pricing')
    return
  }

  if(type==='premium'){
    const exp=new Date(); exp.setMonth(exp.getMonth()+1)
    await sb.from('profiles').update({is_premium:true,premium_expires_at:exp.toISOString()}).eq('id',uid)
  } else if(type==='featured'){
    await sb.from('profiles').update({is_featured:true}).eq('id',uid)
  } else if(type==='top_student'){
    await sb.from('profiles').update({is_verified:true}).eq('id',uid)
  } else if(type==='boost'){
    const exp=new Date(); exp.setHours(exp.getHours()+24)
    await sb.from('profiles').update({is_featured:true,boost_expires_at:exp.toISOString()}).eq('id',uid)
  } else if(type==='unlock'&&payment.target_id){
    await sb.from('unlock_requests').upsert({requester_id:uid,target_id:payment.target_id,status:'approved'})
    const {data:buyer}=await sb.from('profiles').select('full_name').eq('id',uid).maybeSingle()
    notify(payment.target_id,'Someone unlocked your number! 💰',`${buyer?.full_name||'A user'} paid KES 20 to connect with you`,'/dashboard')
  } else if(type&&type.startsWith('gift_')&&payment.target_id){
    const giftType=type.replace('gift_','')
    await sb.from('gifts').insert([{sender_id:uid,receiver_id:payment.target_id,gift_type:giftType,amount:payment.amount||0,status:'completed'}])
    const {data:recv}=await sb.from('profiles').select('gift_earnings').eq('id',payment.target_id).maybeSingle()
    await sb.from('profiles').update({gift_earnings:(recv?.gift_earnings||0)+(payment.amount||0)}).eq('id',payment.target_id)
    const {data:sender}=await sb.from('profiles').select('full_name').eq('id',uid).maybeSingle()
    notify(payment.target_id,`You received a gift! 🎁`,`${sender?.full_name||'Someone'} sent you a ${giftType}`,'/dashboard')
  }
}

function notify(userId:string,title:string,body:string,url:string){
  fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push-notify`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({userId,title,body,url})
  }).catch(()=>{})
}
