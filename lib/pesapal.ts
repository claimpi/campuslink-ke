// Pesapal v3 API Integration

const PESAPAL_BASE = process.env.PESAPAL_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://campuslink-ke.vercel.app'

// 1. Get OAuth token
export async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  })
  const data = await res.json()
  if (!data.token) throw new Error('Failed to get Pesapal token: ' + JSON.stringify(data))
  return data.token
}

// 2. Register IPN URL (run once)
export async function registerIPN(token: string): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: `${SITE_URL}/api/pesapal/ipn`,
      ipn_notification_type: 'POST',
    }),
  })
  const data = await res.json()
  return data.ipn_id
}

// 3. Submit order and get redirect URL
export async function submitOrder(params: {
  token: string
  ipnId: string
  amount: number
  description: string
  reference: string
  email: string
  phone?: string
  firstName: string
  lastName: string
}): Promise<{ redirectUrl: string; orderTrackingId: string }> {
  const res = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      id: params.reference,
      currency: 'KES',
      amount: params.amount,
      description: params.description,
      callback_url: `${SITE_URL}/payment/callback`,
      notification_id: params.ipnId,
      billing_address: {
        email_address: params.email,
        phone_number: params.phone || '',
        first_name: params.firstName,
        last_name: params.lastName,
      },
    }),
  })
  const data = await res.json()
  if (!data.redirect_url) throw new Error('Failed to submit order: ' + JSON.stringify(data))
  return { redirectUrl: data.redirect_url, orderTrackingId: data.order_tracking_id }
}

// 4. Check transaction status
export async function getTransactionStatus(token: string, orderTrackingId: string) {
  const res = await fetch(
    `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  )
  return res.json()
}

export type PaymentType = 'premium' | 'featured' | 'top_student'

export const PAYMENT_AMOUNTS: Record<PaymentType, number> = {
  premium: 199,
  featured: 200,
  top_student: 100,
}

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  premium: 'Premium Membership (1 Month)',
  featured: 'Featured Student - Homepage',
  top_student: 'Top Student Badge',
}
