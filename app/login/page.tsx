'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function login(e: any) {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) { setErr(error.message); setBusy(false); return }
    router.replace('/home')
  }

  async function google() {
    setBusy(true)
    await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/home` } })
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: 'linear-gradient(145deg,#f43f5e,#ec4899)', padding: '56px 28px 44px', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>💕</div>
        <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 4 }}>Welcome Back</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Sign in to continue matching</p>
      </div>
      <form onSubmit={login} style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Inp label="Email" type="email" value={email} onChange={(e:any) => setEmail(e.target.value)} placeholder="you@gmail.com" />
        <Inp label="Password" type="password" value={password} onChange={(e:any) => setPassword(e.target.value)} placeholder="Your password" />
        <div style={{ textAlign: 'right', marginTop: -8 }}>
          <span onClick={() => router.push('/forgot-password')} style={{ fontSize: 13, color: '#f43f5e', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</span>
        </div>
        {err && <p style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '10px 14px', borderRadius: 10 }}>{err}</p>}
        <button type="submit" disabled={busy}
          style={{ width: '100%', padding: '16px', borderRadius: 50, border: 'none', background: busy ? '#f3f4f6' : 'linear-gradient(135deg,#f43f5e,#ec4899)', color: busy ? '#9ca3af' : '#fff', fontSize: 16, fontWeight: 900, boxShadow: busy ? 'none' : '0 4px 20px rgba(244,63,94,0.3)' }}>
          {busy ? '...' : 'Sign In'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} /><span style={{ color: '#9ca3af', fontSize: 12 }}>or</span><div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>
        <button type="button" onClick={google} style={{ width: '100%', padding: '15px', borderRadius: 50, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>G</span> Continue with Google
        </button>
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          No account? <span onClick={() => router.push('/register')} style={{ color: '#f43f5e', fontWeight: 700, cursor: 'pointer' }}>Join Free</span>
        </p>
      </form>
    </div>
  )
}
function Inp({ label, ...props }: any) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <input {...props} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: '100%', border: `1.5px solid ${f ? '#f43f5e' : '#e5e7eb'}`, borderRadius: 14, padding: '13px 16px', fontSize: 15, outline: 'none', transition: 'border 0.2s' }} />
    </div>
  )
}
