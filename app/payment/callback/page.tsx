'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const orderTrackingId = searchParams.get('OrderTrackingId')
  const merchantRef = searchParams.get('OrderMerchantReference')

  useEffect(() => {
    if (!orderTrackingId) { setStatus('failed'); return }
    // Check payment status
    async function checkStatus() {
      try {
        const res = await fetch(`/api/pesapal/status?orderTrackingId=${orderTrackingId}`)
        const data = await res.json()
        if (data.payment_status_description === 'Completed') {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 4000)
        } else if (data.payment_status_description === 'Failed') {
          setStatus('failed')
        } else {
          setStatus('pending')
        }
      } catch {
        setStatus('pending')
      }
    }
    checkStatus()
  }, [orderTrackingId])

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#f9fafb,#fff7ed)'}}>
      <div style={{textAlign:'center',maxWidth:'420px',background:'white',borderRadius:'24px',padding:'40px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',border:'1px solid #f3f4f6'}}>
        {status === 'loading' && (
          <>
            <div style={{width:'56px',height:'56px',border:'4px solid #fed7aa',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 20px'}}/>
            <h2 style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'8px'}}>Verifying Payment...</h2>
            <p style={{color:'#9ca3af',fontSize:'14px'}}>Please wait while we confirm your payment</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{fontSize:'64px',marginBottom:'16px'}}>🎉</div>
            <h2 style={{fontSize:'22px',fontWeight:'900',color:'#16a34a',marginBottom:'8px'}}>Payment Successful!</h2>
            <p style={{color:'#6b7280',fontSize:'14px',marginBottom:'20px'}}>Your account has been upgraded. Redirecting to dashboard in 4 seconds...</p>
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'14px',marginBottom:'20px'}}>
              <p style={{color:'#16a34a',fontSize:'13px',fontWeight:'600',margin:0}}>✅ Profile upgrade applied automatically</p>
            </div>
            <Link href="/dashboard" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',textDecoration:'none'}}>
              Go to Dashboard →
            </Link>
          </>
        )}
        {status === 'pending' && (
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>⏳</div>
            <h2 style={{fontSize:'20px',fontWeight:'900',color:'#ca8a04',marginBottom:'8px'}}>Payment Processing</h2>
            <p style={{color:'#6b7280',fontSize:'14px',marginBottom:'20px'}}>Your payment is being processed. Your account will be upgraded shortly.</p>
            <p style={{color:'#9ca3af',fontSize:'12px',marginBottom:'20px'}}>Ref: {merchantRef}</p>
            <Link href="/dashboard" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',textDecoration:'none'}}>
              Go to Dashboard
            </Link>
          </>
        )}
        {status === 'failed' && (
          <>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>❌</div>
            <h2 style={{fontSize:'20px',fontWeight:'900',color:'#dc2626',marginBottom:'8px'}}>Payment Failed</h2>
            <p style={{color:'#6b7280',fontSize:'14px',marginBottom:'20px'}}>Something went wrong with your payment. Please try again.</p>
            <Link href="/pricing" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',textDecoration:'none'}}>
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'85vh'}}>Loading...</div>}><CallbackContent/></Suspense>
}
