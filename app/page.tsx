'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const SLIDES = [
  { bg: 'linear-gradient(160deg,#f97316,#ea580c)', icon: '💕', title: 'Find Your Match', sub: 'Swipe through real people near you in Kenya' },
  { bg: 'linear-gradient(160deg,#ec4899,#be185d)', icon: '💬', title: 'Chat & Connect',  sub: 'Send messages, gifts and coins to people you like' },
  { bg: 'linear-gradient(160deg,#7c3aed,#6d28d9)', icon: '🇰🇪', title: 'Made for Kenya', sub: 'M-Pesa payments, local connections, real people' },
]

export default function SplashPage() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }: any) => {
      if (user) router.replace('/home')
      else setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 3200)
    return () => clearInterval(t)
  }, [ready])

  if (!ready) return (
    <div style={{ height: '100dvh', background: 'linear-gradient(160deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12, animation: 'heartbeat 1.5s ease infinite' }}>💕</div>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px' }}>CampusLink KE</p>
      </div>
    </div>
  )

  const s = SLIDES[idx]
  return (
    <div style={{ height: '100dvh', background: s.bg, display: 'flex', flexDirection: 'column', transition: 'background 0.6s ease', overflow: 'hidden' }}>
      {/* Illustration area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div key={idx} style={{ fontSize: 100, marginBottom: 28, animation: 'pop 0.5s ease' }}>{s.icon}</div>
        <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px', lineHeight: 1.15 }}>{s.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 1.65, maxWidth: 300 }}>{s.sub}</p>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingBottom: 28 }}>
        {SLIDES.map((_, i) => (
          <div key={i} onClick={() => setIdx(i)} style={{ height: 8, width: i === idx ? 28 : 8, borderRadius: 4, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s', cursor: 'pointer' }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ padding: '0 24px', paddingBottom: 'max(40px,env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => router.push('/register')}
          style={{ width: '100%', padding: '17px', borderRadius: 50, background: '#fff', color: '#f97316', fontSize: 17, fontWeight: 900, boxShadow: '0 6px 24px rgba(0,0,0,0.18)', letterSpacing: '-0.3px' }}>
          Create Free Account
        </button>
        <button onClick={() => router.push('/login')}
          style={{ width: '100%', padding: '16px', borderRadius: 50, border: '2px solid rgba(255,255,255,0.55)', background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 700 }}>
          Sign In
        </button>
      </div>
    </div>
  )
}
