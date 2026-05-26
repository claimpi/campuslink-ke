'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://www.campuslink.co.ke/reset-password'
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width:'100%', border:'1.5px solid #e2e8f0', borderRadius:'10px',
    padding:'11px 14px', fontSize:'14px', outline:'none',
    background:'#fff', boxSizing:'border-box', color:'#0f172a'
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{width:'100%',maxWidth:'400px',background:'#fff',borderRadius:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:'36px',border:'1px solid #e2e8f0'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'16px',margin:'0 auto 12px'}}>CL</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Forgot Password</h1>
          <p style={{color:'#94a3b8',fontSize:'13px'}}>Enter your email and we'll send a reset link</p>
        </div>

        {sent ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>📧</div>
            <p style={{fontWeight:'700',color:'#16a34a',fontSize:'16px',marginBottom:'8px'}}>Email sent!</p>
            <p style={{color:'#64748b',fontSize:'13px',marginBottom:'20px'}}>Check your inbox for a password reset link. It may take a few minutes.</p>
            <Link href="/login" style={{display:'block',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',textAlign:'center'}}>
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required style={inp}
                  onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <button type="submit" disabled={loading} style={{background:loading?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                {loading?'Sending...':'Send Reset Link'}
              </button>
            </form>
            <p style={{textAlign:'center',fontSize:'13px',color:'#94a3b8',marginTop:'16px'}}>
              Remember your password? <Link href="/login" style={{color:'#f97316',fontWeight:'700'}}>Sign In</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
