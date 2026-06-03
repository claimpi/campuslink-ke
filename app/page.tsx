'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const slides = [
  { emoji: '💕', title: 'Find Your Match', sub: 'Discover people near you who share your vibe', bg: '#f97316' },
  { emoji: '💬', title: 'Chat Freely', sub: 'Send messages, gifts and coins to those you like', bg: '#ec4899' },
  { emoji: '🌍', title: 'Made for Kenya', sub: 'M-Pesa payments, local connections, real people', bg: '#7c3aed' },
]

export default function SplashPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/home')
      else setChecking(false)
    })
  }, [])

  useEffect(() => {
    if (checking) return
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 3000)
    return () => clearInterval(t)
  }, [checking])

  if (checking) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f97316' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>💕</div>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>CampusLink KE</p>
      </div>
    </div>
  )

  const s = slides[idx]
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: s.bg, transition: 'background 0.5s', overflow: 'hidden' }}>
      {/* Slide */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 80, marginBottom: 24, animation: 'pulse 2s ease infinite' }}>{s.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>{s.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, lineHeight: 1.6, maxWidth: 280 }}>{s.sub}</p>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
        {slides.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s', cursor: 'pointer' }} />
        ))}
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => router.push('/register')}
          style={{ width: '100%', padding: '16px', borderRadius: 28, border: 'none', background: '#fff', color: s.bg, fontSize: 16, fontWeight: 900, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          Create Account — Free
        </button>
        <button onClick={() => router.push('/login')}
          style={{ width: '100%', padding: '15px', borderRadius: 28, border: '2px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 700 }}>
          Sign In
        </button>
      </div>
    </div>
  )
}
