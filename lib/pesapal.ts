export const AMOUNTS:Record<string,number>={
  // Existing
  premium:299,featured:200,top_student:150,unlock:20,
  add_group:100,boost:50,
  gift_rose:30,gift_heart:60,gift_star:120,gift_crown:250,gift_diamond:500,
  // Coin packages
  coins_50:50,coins_100:99,coins_200:179,coins_500:399,coins_1000:699,
}
export const LABELS:Record<string,string>={
  premium:'Premium Membership',featured:'Featured Profile',
  top_student:'Verified Badge',unlock:'WhatsApp Unlock',
  add_group:'WhatsApp Group',boost:'Profile Boost 24hrs',
  gift_rose:'Virtual Rose',gift_heart:'Virtual Heart',
  gift_star:'Virtual Star',gift_crown:'Virtual Crown',gift_diamond:'Virtual Diamond',
  coins_50:'50 Coins Pack',coins_100:'100 Coins Pack',
  coins_200:'200 Coins Pack',coins_500:'500 Coins Pack',coins_1000:'1000 Coins Pack',
}
export const COIN_AMOUNTS:Record<string,number>={
  coins_50:50,coins_100:100,coins_200:200,coins_500:500,coins_1000:1000
}

export async function getToken(){
  const res=await fetch(`${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`,{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
    body:JSON.stringify({consumer_key:process.env.PESAPAL_CONSUMER_KEY,consumer_secret:process.env.PESAPAL_CONSUMER_SECRET})
  })
  const d=await res.json()
  if(!d.token) throw new Error('PesaPal auth failed: '+JSON.stringify(d))
  return d.token as string
}

export async function registerIPN(token:string){
  const res=await fetch(`${process.env.PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${token}`},
    body:JSON.stringify({url:`${process.env.NEXT_PUBLIC_SITE_URL}/api/pesapal/ipn`,ipn_notification_type:'GET'})
  })
  const d=await res.json()
  return d.ipn_id as string
}

export async function submitOrder(p:{token:string,ipnId:string,amount:number,desc:string,ref:string,email:string,phone:string,firstName:string,lastName:string}){
  const res=await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,{
    method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','Authorization':`Bearer ${p.token}`},
    body:JSON.stringify({
      id:p.ref,currency:'KES',amount:p.amount,description:p.desc,
      callback_url:`${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback`,
      notification_id:p.ipnId,
      billing_address:{email_address:p.email,phone_number:p.phone,first_name:p.firstName,last_name:p.lastName}
    })
  })
  const d=await res.json()
  if(!d.redirect_url) throw new Error('PesaPal order failed: '+JSON.stringify(d))
  return{redirectUrl:d.redirect_url as string,orderTrackingId:d.order_tracking_id as string}
}

export async function getStatus(token:string, id:string){
  const res=await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${id}`,
    {headers:{'Authorization':`Bearer ${token}`,'Accept':'application/json'}})
  return res.json()
}
