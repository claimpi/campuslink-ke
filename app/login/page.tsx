'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    createClient().auth.getSession().then(({data:{session}})=>{
      if(session) window.location.href='/'
    })
    // Show error from OAuth callback
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    if(err) setError(decodeURIComponent(err))
  },[])

  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const,transition:'border-color 0.2s'}

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error } = await createClient().auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      window.location.href='/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true); setError('')
    // Use skipBrowserRedirect to get URL, then navigate manually
    // This avoids PKCE storage issues in WebViews
    const { data, error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
        skipBrowserRedirect: true,
      }
    })
    if (error) { setError(error.message); setGoogleLoading(false); return }
    if (data?.url) {
      // Replace current page so callback returns here, not opens new tab
      window.location.replace(data.url)
    }
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
      <div style={{width:'100%',maxWidth:'420px',background:'white',borderRadius:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',padding:'40px',border:'1px solid #f3f4f6'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'900',fontSize:'18px',margin:'0 auto 14px',boxShadow:'0 8px 20px rgba(249,115,22,0.35)'}}>CL</div>
          <h1 style={{fontSize:'26px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Welcome Back</h1>
          <p style={{color:'#9ca3af',fontSize:'14px'}}>Sign in to CampusLink KE</p>
        </div>

        {error&&(
          <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'12px 16px',marginBottom:'20px',color:'#dc2626',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
            ⚠️ {error}
          </div>
        )}

        {/* Google Sign In */}
        <button onClick={handleGoogleLogin} disabled={googleLoading}
          style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'13px',border:'1.5px solid #e2e8f0',borderRadius:'12px',background:'#fff',cursor:googleLoading?'not-allowed':'pointer',fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',transition:'all 0.2s'}}>
          {googleLoading ? (
            <div style={{width:'18px',height:'18px',border:'2px solid #e2e8f0',borderTop:'2px solid #4285f4',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'18px'}}>
          <div style={{flex:1,height:'1px',background:'#e5e7eb'}}/>
          <span style={{fontSize:'12px',color:'#9ca3af',fontWeight:'500'}}>or sign in with email</span>
          <div style={{flex:1,height:'1px',background:'#e5e7eb'}}/>
        </div>

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required style={inp}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          </div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151'}}>Password</label>
              <Link href="/forgot-password" style={{fontSize:'12px',color:'#f97316',textDecoration:'none'}}>Forgot password?</Link>
            </div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={inp}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
          </div>
          <button type="submit" disabled={loading} style={{width:'100%',background:loading?'#fdba74':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:loading?'not-allowed':'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.35)',marginTop:'4px'}}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'14px',color:'#9ca3af',marginTop:'24px'}}>
          Don&apos;t have an account? <Link href="/register" style={{color:'#f97316',fontWeight:'700',textDecoration:'none'}}>Join Free</Link>
        </p>
      </div>
    </div>
  )
}
