'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading'|'success'|'failed'|'pending'>('loading')
  const [paymentType, setPaymentType] = useState<string>('')
  const orderTrackingId = searchParams.get('OrderTrackingId')
  const merchantRef = searchParams.get('OrderMerchantReference')

  useEffect(() => {
    if (!orderTrackingId) { setStatus('failed'); return }
    async function check() {
      try {
        const res = await fetch(`/api/pesapal/status?orderTrackingId=${orderTrackingId}`)
        const data = await res.json()

        if (data.payment_status_description === 'Completed') {
          // Trigger IPN processing immediately (in case IPN hasn't fired yet)
          await fetch(`/api/pesapal/ipn?OrderTrackingId=${orderTrackingId}`)

          const sb = createClient()
          const { data: payment } = await sb.from('payment_requests')
            .select('type').eq('order_tracking_id', orderTrackingId).maybeSingle()
          setPaymentType(payment?.type || '')
          setStatus('success')

          // Auto-redirect to dashboard after 3s
          setTimeout(() => router.push('/dashboard?payment=success'), 3000)
        } else if (data.payment_status_description === 'Failed') {
          setStatus('failed')
        } else {
          setStatus('pending')
        }
      } catch {
        setStatus('pending')
      }
    }
    check()
  }, [orderTrackingId])

  const getSuccessContent = () => {
    if (paymentType === 'premium') return { icon: '👑', title: 'VIP Activated!', msg: 'Your VIP membership is now active. Enjoy all premium features!' }
    if (paymentType === 'featured') return { icon: '⭐', title: 'Featured Active!', msg: 'Your profile is now featured at the top of Discover.' }
    if (paymentType === 'top_student') return { icon: '✓', title: 'Verified!', msg: 'Your verified badge is now showing on your profile.' }
    if (paymentType === 'boost') return { icon: '🚀', title: 'Profile Boosted!', msg: 'You appear at the top of Discover for the next 24 hours.' }
    if (paymentType?.startsWith('coins_')) return { icon: '🪙', title: 'Coins Added!', msg: 'Your coins have been added to your wallet.' }
    return { icon: '🎉', title: 'Payment Successful!', msg: 'Your account has been updated.' }
  }

  const { icon, title, msg } = getSuccessContent()

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{textAlign:'center',maxWidth:'380px',background:'#fff',borderRadius:'20px',padding:'40px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',border:'1px solid #e2e8f0',width:'100%'}}>

        {status==='loading'&&(
          <>
            <div style={{width:'48px',height:'48px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 20px'}}/>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',marginBottom:'8px'}}>Verifying Payment</h2>
            <p style={{color:'#94a3b8',fontSize:'14px'}}>Please wait a moment...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}

        {status==='success'&&(
          <>
            <div style={{fontSize:'56px',marginBottom:'16px'}}>{icon}</div>
            <h2 style={{fontSize:'22px',fontWeight:'900',color:'#16a34a',marginBottom:'8px'}}>{title}</h2>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'24px',lineHeight:1.6}}>{msg}</p>
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:'10px',marginBottom:20,fontSize:12,color:'#16a34a',fontWeight:600}}>
              Redirecting to dashboard in 3 seconds...
            </div>
            <Link href="/dashboard" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',textDecoration:'none'}}>
              Go to Dashboard →
            </Link>
          </>
        )}

        {status==='pending'&&(
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>⏳</div>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#ca8a04',marginBottom:'8px'}}>Payment Processing</h2>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>Your M-Pesa payment is being confirmed. This usually takes a few seconds.</p>
            <p style={{color:'#94a3b8',fontSize:'12px',marginBottom:'20px'}}>Ref: {merchantRef}</p>
            <button onClick={()=>window.location.reload()} style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer',marginBottom:'8px'}}>
              🔄 Check Again
            </button>
            <Link href="/dashboard" style={{display:'block',color:'#94a3b8',fontSize:'13px',marginTop:'8px',textDecoration:'none'}}>Go to Dashboard</Link>
          </>
        )}

        {status==='failed'&&(
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>❌</div>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#dc2626',marginBottom:'8px'}}>Payment Failed</h2>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>Something went wrong. Please try again.</p>
            <Link href="/pricing" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',textDecoration:'none'}}>
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'85vh'}}>
        <div style={{width:'36px',height:'36px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CallbackContent/>
    </Suspense>
  )
}
