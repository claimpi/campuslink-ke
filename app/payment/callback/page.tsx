'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading'|'success'|'failed'|'pending'>('loading')
  const [targetId, setTargetId] = useState<string|null>(null)
  const [whatsapp, setWhatsapp] = useState<string|null>(null)
  const orderTrackingId = searchParams.get('OrderTrackingId')
  const merchantRef = searchParams.get('OrderMerchantReference')

  useEffect(() => {
    if (!orderTrackingId) { setStatus('failed'); return }
    async function check() {
      try {
        // Check payment status
        const res = await fetch(`/api/pesapal/status?orderTrackingId=${orderTrackingId}`)
        const data = await res.json()

        if (data.payment_status_description === 'Completed') {
          setStatus('success')
          // Get the payment record to find targetId
          const sb = createClient()
          const { data: payment } = await sb.from('payment_requests')
            .select('*').eq('order_tracking_id', orderTrackingId).maybeSingle()

          if (payment?.target_id) {
            setTargetId(payment.target_id)
            // Get the target's whatsapp number
            const { data: profile } = await sb.from('profiles')
              .select('whatsapp_number,full_name').eq('id', payment.target_id).maybeSingle()
            if (profile?.whatsapp_number) setWhatsapp(profile.whatsapp_number)
          } else {
            // Not an unlock - redirect to dashboard after 3s
            setTimeout(() => router.push('/dashboard'), 3000)
          }
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

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{textAlign:'center',maxWidth:'400px',background:'#fff',borderRadius:'20px',padding:'40px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',border:'1px solid #e2e8f0',width:'100%'}}>

        {status==='loading'&&(
          <>
            <div style={{width:'48px',height:'48px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 20px'}}/>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',marginBottom:'8px'}}>Verifying Payment</h2>
            <p style={{color:'#94a3b8',fontSize:'14px'}}>Please wait...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}

        {status==='success'&&(
          <>
            <div style={{fontSize:'52px',marginBottom:'16px'}}>🎉</div>
            <h2 style={{fontSize:'20px',fontWeight:'800',color:'#16a34a',marginBottom:'8px'}}>Payment Successful!</h2>

            {whatsapp&&targetId ? (
              <>
                <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>WhatsApp number unlocked. Tap below to connect now.</p>
                <a href={`https://wa.me/${whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{display:'block',background:'#16a34a',color:'#fff',padding:'14px',borderRadius:'12px',fontWeight:'700',fontSize:'16px',marginBottom:'12px',textDecoration:'none'}}>
                  💬 Open WhatsApp — {whatsapp}
                </a>
                <Link href={`/profile/${targetId}`} style={{display:'block',border:'1px solid #e2e8f0',color:'#64748b',padding:'11px',borderRadius:'10px',fontSize:'14px',fontWeight:'600'}}>
                  ← Back to Profile
                </Link>
              </>
            ):(
              <>
                <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>Your account has been upgraded successfully.</p>
                <Link href="/dashboard" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
                  Go to Dashboard
                </Link>
              </>
            )}
          </>
        )}

        {status==='pending'&&(
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>⏳</div>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#ca8a04',marginBottom:'8px'}}>Payment Processing</h2>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>Your payment is being confirmed. This usually takes a few seconds.</p>
            <p style={{color:'#94a3b8',fontSize:'12px',marginBottom:'20px'}}>Ref: {merchantRef}</p>
            <button onClick={()=>window.location.reload()} style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer',marginBottom:'8px'}}>
              Check Again
            </button>
            <Link href="/dashboard" style={{display:'block',color:'#94a3b8',fontSize:'13px',marginTop:'8px'}}>Go to Dashboard</Link>
          </>
        )}

        {status==='failed'&&(
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>❌</div>
            <h2 style={{fontSize:'18px',fontWeight:'800',color:'#dc2626',marginBottom:'8px'}}>Payment Failed</h2>
            <p style={{color:'#64748b',fontSize:'14px',marginBottom:'20px'}}>Something went wrong. Please try again.</p>
            <Link href="/pricing" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px'}}>
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
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'85vh'}}><div style={{width:'36px',height:'36px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <CallbackContent/>
    </Suspense>
  )
}
