'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const SLIDES = [
  { bg: '#c2185b', emoji: '💕', title: 'Find Your Match', body: 'Swipe through real people near you in Kenya' },
  { bg: '#7b1fa2', emoji: '💬', title: 'Chat & Connect', body: 'Send messages and gifts to people you like' },
  { bg: '#0288d1', emoji: '🇰🇪', title: 'Made for Kenya', body: 'M-Pesa payments, local connections, real people' },
]

export default function Splash() {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }: any) => {
      if (user) router.replace('/home')
      else setReady(true)
    })
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => setI(x => (x + 1) % SLIDES.length), 3000)
    return () => clearInterval(t)
  }, [ready])

  if (!ready) return (
    <div style={{ height: '100dvh', background: '#c2185b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, animation: 'pulse 1.4s ease infinite' }}>💕</div>
        <p style={{ color: '#fff', fontWeight: 900, fontSize: 22, marginTop: 12 }}>CampusLink KE</p>
      </div>
    </div>
  )

  const s = SLIDES[i]
  return (
    <div style={{ height: '100dvh', background: s.bg, display: 'flex', flexDirection: 'column', transition: 'background 0.5s' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div key={i} style={{ fontSize: 96, marginBottom: 28, animation: 'pop 0.45s ease' }}>{s.emoji}</div>
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 900, marginBottom: 14, letterSpacing: '-0.5px' }}>{s.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 1.6, maxWidth: 300 }}>{s.body}</p>
      </div>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center', paddingBottom: 24 }}>
        {SLIDES.map((_, j) => (
          <div key={j} onClick={() => setI(j)} style={{ height: 8, width: j === i ? 26 : 8, borderRadius: 4, background: j === i ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s', cursor: 'pointer' }} />
        ))}
      </div>
      <div style={{ padding: '0 24px', paddingBottom: 'max(44px,env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => router.push('/onboarding')}
          style={{ width: '100%', padding: '17px', borderRadius: 50, background: '#fff', color: s.bg, fontSize: 17, fontWeight: 900, boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>
          Create Free Account
        </button>
        <button onClick={() => router.push('/login')}
          style={{ width: '100%', padding: '16px', borderRadius: 50, border: '2px solid rgba(255,255,255,0.5)', background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 700 }}>
          Sign In
        </button>
      </div>
    </div>
  )
}
