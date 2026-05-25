'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError('Incorrect password. Access denied.')
        setPassword('')
      }
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#1f2937,#111827)'}}>
      <div style={{width:'100%',maxWidth:'380px'}}>
        {/* Lock icon */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'64px',height:'64px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'18px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 14px',boxShadow:'0 8px 24px rgba(249,115,22,0.4)'}}>
            🔐
          </div>
          <h1 style={{fontSize:'22px',fontWeight:'900',color:'white',marginBottom:'4px'}}>Admin Access</h1>
          <p style={{color:'#6b7280',fontSize:'14px'}}>CampusLink KE Management</p>
        </div>

        {error && (
          <div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'12px',padding:'12px 16px',marginBottom:'16px',color:'#fca5a5',fontSize:'14px',textAlign:'center'}}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{background:'rgba(255,255,255,0.05)',backdropFilter:'blur(12px)',borderRadius:'20px',padding:'28px',border:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{marginBottom:'18px'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#9ca3af',display:'block',marginBottom:'8px',letterSpacing:'0.5px'}}>ADMIN PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              style={{width:'100%',background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.15)',borderRadius:'12px',padding:'13px 16px',fontSize:'15px',outline:'none',color:'white',boxSizing:'border-box',letterSpacing:'2px'}}
              onFocus={e => e.target.style.borderColor='#f97316'}
              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.15)'}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            style={{width:'100%',background:loading||!password?'rgba(249,115,22,0.4)':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:loading||!password?'not-allowed':'pointer',boxShadow:loading||!password?'none':'0 6px 16px rgba(249,115,22,0.35)',transition:'all 0.2s'}}>
            {loading ? '🔄 Verifying...' : '🔓 Enter Dashboard'}
          </button>
        </form>

        <p style={{textAlign:'center',color:'#4b5563',fontSize:'12px',marginTop:'20px'}}>
          Unauthorized access is prohibited
        </p>
      </div>
    </div>
  )
}
