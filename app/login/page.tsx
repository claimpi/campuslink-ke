'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const,transition:'border-color 0.2s'}

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
      <div style={{width:'100%',maxWidth:'420px',background:'white',borderRadius:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',padding:'40px',border:'1px solid #f3f4f6'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'900',fontSize:'18px',margin:'0 auto 14px',boxShadow:'0 8px 20px rgba(249,115,22,0.35)'}}>CL</div>
          <h1 style={{fontSize:'26px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Welcome Back</h1>
          <p style={{color:'#9ca3af',fontSize:'14px'}}>Sign in to CampusLink KE</p>
        </div>

        {error && (
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',color:'#dc2626',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required style={inp}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151'}}>Password</label>
              <Link href="/forgot-password" style={{fontSize:'12px',color:'#f97316',textDecoration:'none'}}>Forgot password?</Link>
            </div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={inp}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <button type="submit" disabled={loading} style={{width:'100%',background:loading?'#fdba74':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:loading?'not-allowed':'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.35)',marginTop:'4px',transition:'all 0.2s'}}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:'24px'}}>
          <p style={{fontSize:'14px',color:'#9ca3af'}}>
            Don't have an account? <Link href="/register" style={{color:'#f97316',fontWeight:'700',textDecoration:'none'}}>Join Free</Link>
          </p>
        </div>

        {/* Demo hint */}
        <div style={{marginTop:'20px',background:'#f9fafb',borderRadius:'12px',padding:'12px',textAlign:'center'}}>
          <p style={{fontSize:'12px',color:'#6b7280',margin:0}}>✨ New here? <Link href="/register" style={{color:'#f97316',fontWeight:'600',textDecoration:'none'}}>Create a free account</Link> in 30 seconds</p>
        </div>
      </div>
    </div>
  )
}
