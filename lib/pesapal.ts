const BASE = process.env.PESAPAL_ENV==='production'
  ?'https://pay.pesapal.com/v3'
  :'https://cybqa.pesapal.com/pesapalv3'
const SITE = process.env.NEXT_PUBLIC_SITE_URL||'https://campuslink-ke.vercel.app'

export async function getToken():Promise<string>{
  const r=await fetch(`${BASE}/api/Auth/RequestToken`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({consumer_key:process.env.PESAPAL_CONSUMER_KEY,consumer_secret:process.env.PESAPAL_CONSUMER_SECRET})})
  const d=await r.json()
  if(!d.token) throw new Error('Token failed: '+JSON.stringify(d))
  return d.token
}

export async function registerIPN(token:string):Promise<string>{
  const r=await fetch(`${BASE}/api/URLSetup/RegisterIPN`,{method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({url:`${SITE}/api/pesapal/ipn`,ipn_notification_type:'POST'})})
  const d=await r.json()
  return d.ipn_id
}

export async function submitOrder(p:{token:string,ipnId:string,amount:number,desc:string,ref:string,email:string,phone:string,firstName:string,lastName:string}){
  const r=await fetch(`${BASE}/api/Transactions/SubmitOrderRequest`,{method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${p.token}`},
    body:JSON.stringify({id:p.ref,currency:'KES',amount:p.amount,description:p.desc,callback_url:`${SITE}/payment/callback`,
      notification_id:p.ipnId,billing_address:{email_address:p.email,phone_number:p.phone,first_name:p.firstName,last_name:p.lastName}})})
  const d=await r.json()
  if(!d.redirect_url) throw new Error('Order failed: '+JSON.stringify(d))
  return {redirectUrl:d.redirect_url,orderTrackingId:d.order_tracking_id}
}

export async function getStatus(token:string,trackingId:string){
  const r=await fetch(`${BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
    {headers:{'Accept':'application/json','Authorization':`Bearer ${token}`}})
  return r.json()
}

export const AMOUNTS:Record<string,number>={premium:299,featured:200,top_student:150,unlock:20,add_group:100,boost:50,gift_rose:30,gift_heart:60,gift_star:120,gift_crown:250,gift_diamond:500}
export const LABELS:Record<string,string>={premium:'Premium Membership',featured:'Featured Profile',top_student:'Verified Badge',unlock:'WhatsApp Unlock',add_group:'WhatsApp Group Listing',boost:'Profile Boost 24hrs',gift_rose:'Virtual Rose Gift',gift_heart:'Virtual Heart Gift',gift_star:'Virtual Star Gift',gift_crown:'Virtual Crown Gift',gift_diamond:'Virtual Diamond Gift'}
