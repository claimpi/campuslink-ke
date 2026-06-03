'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState<string|null>(null)

  async function handleLogin(e: any) {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.replace('/home')
  }

  async function handleGoogle() {
    setLoading(true)
    const sb = createClient()
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/home` } })
  }

  const inp = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused(null),
    style: { width: '100%', border: `1.5px solid ${focused === key ? '#f97316' : '#e8e8e8'}`, borderRadius: 14, padding: '14px 16px', fontSize: 15, outline: 'none', background: '#fff', transition: 'border 0.2s', boxSizing: 'border-box' as const }
  })

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#f97316,#ec4899)', padding: '48px 24px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>💕</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 4 }}>Welcome Back</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Sign in to continue</p>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" {...inp('email')} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" {...inp('password')} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <span onClick={() => router.push('/forgot-password')} style={{ fontSize: 13, color: '#f97316', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</span>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '10px 14px', borderRadius: 10 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '16px', borderRadius: 28, border: 'none', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#f97316,#ea580c)', color: loading ? '#94a3b8' : '#fff', fontSize: 16, fontWeight: 800, boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,0.35)' }}>
            {loading ? '...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
          <span style={{ color: '#94a3b8', fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
        </div>

        <button onClick={handleGoogle}
          style={{ width: '100%', padding: '15px', borderRadius: 28, border: '1.5px solid #e8e8e8', background: '#fff', color: '#374151', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
          Don't have an account?{' '}
          <span onClick={() => router.push('/register')} style={{ color: '#f97316', fontWeight: 700, cursor: 'pointer' }}>Join Free</span>
        </p>
      </div>
    </div>
  )
}
