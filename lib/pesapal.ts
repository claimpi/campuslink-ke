export const COIN_PACKAGES = [
  { coins: 50,   price: 50,  label: 'Starter' },
  { coins: 100,  price: 99,  label: 'Basic' },
  { coins: 200,  price: 179, label: 'Popular' },
  { coins: 500,  price: 399, label: 'Pro' },
  { coins: 1000, price: 699, label: 'Premium' },
]

export const VIP_PLANS = [
  { type: 'boost',      price: 50,  label: 'Profile Boost',    desc: 'Appear at top for 24hrs' },
  { type: 'top_student',price: 150, label: 'Verified Badge',   desc: 'Get the ✓ verified badge' },
  { type: 'featured',   price: 200, label: 'Featured Profile', desc: 'Featured for 7 days' },
  { type: 'premium',    price: 299, label: 'VIP Membership',   desc: 'All features + badge' },
]

export const AMOUNTS: Record<string,number> = {
  coins_50:50, coins_100:99, coins_200:179, coins_500:399, coins_1000:699,
  boost:50, top_student:150, featured:200, premium:299,
}

export const LABELS: Record<string,string> = {
  coins_50:'50 Coins', coins_100:'100 Coins', coins_200:'200 Coins', coins_500:'500 Coins', coins_1000:'1000 Coins',
  boost:'Profile Boost', top_student:'Verified Badge', featured:'Featured Profile', premium:'VIP Membership',
}

export const COIN_AMOUNTS: Record<string,number> = {
  coins_50:50, coins_100:100, coins_200:200, coins_500:500, coins_1000:1000,
}

export async function getToken(): Promise<string> {
  const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method:'POST', headers:{'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({consumer_key:process.env.PESAPAL_CONSUMER_KEY,consumer_secret:process.env.PESAPAL_CONSUMER_SECRET}),
  })
  const d = await res.json()
  if(!d.token) throw new Error(d.message||'Token failed')
  return d.token
}

export async function registerIPN(token:string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/pesapal/ipn`
  const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
    method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
    body:JSON.stringify({url,ipn_notification_type:'GET'}),
  })
  const d = await res.json()
  return d.ipn_id
}

export async function submitOrder(token:string,ipnId:string,opts:{ref:string,amount:number,desc:string,email:string,name:string,phone:string,callbackUrl:string}): Promise<{redirectUrl?:string;error?:string}> {
  const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
    body:JSON.stringify({
      id:opts.ref, currency:'KES', amount:opts.amount, description:opts.desc,
      callback_url:opts.callbackUrl, notification_id:ipnId,
      billing_address:{email_address:opts.email,first_name:opts.name.split(' ')[0]||'User',last_name:opts.name.split(' ')[1]||'',phone_number:opts.phone||''},
    }),
  })
  const d = await res.json()
  if(d.redirect_url) return {redirectUrl:d.redirect_url}
  return {error:d.message||'Payment failed'}
}

export async function getStatus(token:string,orderTrackingId:string): Promise<any> {
  const res = await fetch(`${process.env.PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
    headers:{Authorization:`Bearer ${token}`},
  })
  return res.json()
}
