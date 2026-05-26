'use client'
import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function ResetContent() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const inp: React.CSSProperties = {
    width:'100%', border:'1.5px solid #e2e8f0', borderRadius:'10px',
    padding:'11px 14px', fontSize:'14px', outline:'none',
    background:'#fff', boxSizing:'border-box', color:'#0f172a'
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { error } = await createClient().auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    // Force refresh session then redirect
    await createClient().auth.refreshSession()
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1500)
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{width:'100%',maxWidth:'400px',background:'#fff',borderRadius:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:'36px',border:'1px solid #e2e8f0'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'16px',margin:'0 auto 12px'}}>CL</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Reset Password</h1>
          <p style={{color:'#94a3b8',fontSize:'13px'}}>Enter your new password</p>
        </div>

        {done ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'48px',marginBottom:'16px'}}>✅</div>
            <p style={{fontWeight:'700',color:'#16a34a',fontSize:'16px',marginBottom:'8px'}}>Password updated!</p>
            <p style={{color:'#64748b',fontSize:'13px'}}>Redirecting to dashboard...</p>
          </div>
        ) : (
          <>
            {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}
            <form onSubmit={handleReset} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>New Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required style={inp}
                  onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Confirm Password</label>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat password" required style={inp}
                  onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <button type="submit" disabled={loading} style={{background:loading?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                {loading?'Updating...':'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div/>}><ResetContent/></Suspense>
}
