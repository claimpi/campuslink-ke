'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Suspense } from 'react'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

function HomeContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const isNew = sp.get('new') === 'true'
  const [profiles, setProfiles] = useState<any[]>([])
  const [index, setIndex] = useState(0)
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [decision, setDecision] = useState<'like'|'pass'|null>(null)
  const [matchPop, setMatchPop] = useState<any>(null)
  const [dailyReward, setDailyReward] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(isNew)
  const startX = useRef(0)
  const startY = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const THRESHOLD = 90

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) { router.replace('/'); return }
      sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }: any) => setMe(data))
      // Daily reward
      fetch('/api/daily-reward', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
        .then(r => r.json()).then(d => { if (d.success) setDailyReward(d) })
      // Load profiles
      sb.from('profiles').select('id,full_name,avatar_url,photos,age,gender,looking_for,bio,location_name,latitude,longitude,is_premium,is_verified,interests')
        .neq('id', user.id).order('is_featured', { ascending: false }).order('last_seen', { ascending: false, nullsFirst: false }).limit(50)
        .then(({ data }: any) => { if (data) setProfiles(data); setLoading(false) })
      // Update last seen
      sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id)
    })
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    setDragging(true)
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const dx = e.touches[0].clientX - startX.current
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (dy > 30) return // vertical scroll
    e.preventDefault()
    setDragX(dx)
  }
  function onTouchEnd() {
    if (!dragging) return
    setDragging(false)
    if (dragX > THRESHOLD) handleLike()
    else if (dragX < -THRESHOLD) handlePass()
    else setDragX(0)
  }
  function onMouseDown(e: React.MouseEvent) { startX.current = e.clientX; setDragging(true) }
  function onMouseMove(e: React.MouseEvent) { if (!dragging) return; setDragX(e.clientX - startX.current) }
  function onMouseUp() { if (!dragging) return; setDragging(false); if (dragX > THRESHOLD) handleLike(); else if (dragX < -THRESHOLD) handlePass(); else setDragX(0) }

  async function handleLike() {
    const profile = profiles[index]
    if (!profile || !me) return
    setDecision('like')
    setTimeout(async () => {
      const res = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: me.id, receiverId: profile.id }) })
      const data = await res.json()
      if (data.isMatch) setMatchPop(profile)
      nextCard()
    }, 400)
  }

  function handlePass() {
    setDecision('pass')
    setTimeout(nextCard, 400)
  }

  function nextCard() {
    setDragX(0)
    setDecision(null)
    setIndex(i => i + 1)
  }

  const profile = profiles[index]
  const allPhotos = profile ? [profile.avatar_url, ...(Array.isArray(profile.photos) ? profile.photos : [])].filter(Boolean) : []
  const [photoIdx, setPhotoIdx] = useState(0)

  const rotate = dragX * 0.06
  const likeOpacity = Math.min(1, dragX / THRESHOLD)
  const passOpacity = Math.min(1, -dragX / THRESHOLD)

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>💕</div>
      <div style={{ width: 36, height: 36, border: '3px solid #fee2e2', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ height: '100dvh', background: '#f5f5f5', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', overflow: 'hidden' }}>

      {/* Welcome popup */}
      {showWelcome && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>You're all set!</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 8 }}>You got <strong style={{ color: '#f97316' }}>10 free coins</strong> to start chatting!</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>Swipe right to like, left to pass</p>
            <button onClick={() => setShowWelcome(false)}
              style={{ width: '100%', padding: '14px', borderRadius: 28, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontSize: 16, fontWeight: 800 }}>
              Start Matching 💕
            </button>
          </div>
        </div>
      )}

      {/* Daily reward popup */}
      {dailyReward && !showWelcome && (
        <div onClick={() => setDailyReward(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: '28px 24px', textAlign: 'center', maxWidth: 280 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎁</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>Daily Coins!</h2>
            <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 14, padding: '14px', margin: '12px 0 16px' }}>
              <p style={{ color: '#fff', fontSize: 28, fontWeight: 900, margin: 0 }}>+{dailyReward.coins} 🪙</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0' }}>Day {dailyReward.streak} streak</p>
            </div>
            <button onClick={() => setDailyReward(null)} style={{ width: '100%', padding: '13px', borderRadius: 28, border: 'none', background: '#f97316', color: '#fff', fontSize: 15, fontWeight: 800 }}>Awesome! 🎉</button>
          </div>
        </div>
      )}

      {/* Match popup */}
      {matchPop && (
        <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,rgba(249,115,22,0.95),rgba(236,72,153,0.95))', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>💞</div>
            <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>It's a Match!</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 28 }}>You and {matchPop.full_name?.split(' ')[0]} liked each other</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
              {[me?.avatar_url, matchPop.avatar_url].map((img, i) => (
                <div key={i} style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff' }}>
                  {img ? <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>{initials(matchPop.full_name)}</div>}
                </div>
              ))}
            </div>
            <button onClick={() => { setMatchPop(null); router.push(`/chat/${matchPop.id}`) }}
              style={{ width: '100%', padding: '16px', borderRadius: 28, border: 'none', background: '#fff', color: '#f97316', fontSize: 16, fontWeight: 900, marginBottom: 12 }}>
              💬 Send a Message
            </button>
            <button onClick={() => setMatchPop(null)} style={{ background: 'transparent', border: '2px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: 28, padding: '14px', fontSize: 15, fontWeight: 700, width: '100%' }}>
              Keep Swiping
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 22 }}>💕</div>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>CampusLink <span style={{ color: '#f97316' }}>KE</span></h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => router.push('/notifications')} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #f0f0f0', background: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔔</button>
          <button onClick={() => router.push('/pricing')} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #f0f0f0', background: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🪙</button>
        </div>
      </div>

      {/* Card stack */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '12px 16px 4px' }}>

        {/* Next card preview */}
        {profiles[index + 1] && (
          <div style={{ position: 'absolute', inset: '16px 22px 8px', borderRadius: 20, overflow: 'hidden', background: '#e8e8e8', transform: 'scale(0.95) translateY(8px)', zIndex: 1 }}>
            {profiles[index + 1].avatar_url && <img src={profiles[index + 1].avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px)', opacity: 0.7 }} alt="" />}
          </div>
        )}

        {/* Main card */}
        {profile ? (
          <div ref={cardRef}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
            style={{
              position: 'absolute', inset: '12px 16px 4px', borderRadius: 20, overflow: 'hidden',
              background: '#fff', zIndex: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
              transition: dragging ? 'none' : decision ? 'transform 0.4s ease, opacity 0.4s' : 'transform 0.3s ease',
              opacity: decision ? 0 : 1,
              cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none',
              transformOrigin: 'bottom center',
            }}>

            {/* Like / Pass overlays */}
            {likeOpacity > 0.05 && (
              <div style={{ position: 'absolute', top: 28, left: 20, zIndex: 10, border: '3px solid #22c55e', borderRadius: 10, padding: '6px 16px', transform: `rotate(-20deg)`, opacity: likeOpacity }}>
                <span style={{ color: '#22c55e', fontWeight: 900, fontSize: 22 }}>LIKE 💚</span>
              </div>
            )}
            {passOpacity > 0.05 && (
              <div style={{ position: 'absolute', top: 28, right: 20, zIndex: 10, border: '3px solid #ef4444', borderRadius: 10, padding: '6px 16px', transform: `rotate(20deg)`, opacity: passOpacity }}>
                <span style={{ color: '#ef4444', fontWeight: 900, fontSize: 22 }}>PASS ✕</span>
              </div>
            )}

            {/* Photos */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {allPhotos[photoIdx]
                ? <img src={allPhotos[photoIdx]} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} alt="" />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f97316,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: '#fff' }}>{initials(profile.full_name)}</div>
              }
            </div>

            {/* Photo tap zones */}
            {allPhotos.length > 1 && <>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '70%', zIndex: 5 }} onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.max(0, i - 1)) }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '70%', zIndex: 5 }} onClick={e => { e.stopPropagation(); setPhotoIdx(i => Math.min(allPhotos.length - 1, i + 1)) }} />
            </>}

            {/* Photo dots */}
            {allPhotos.length > 1 && (
              <div style={{ position: 'absolute', top: 10, left: 0, right: 0, display: 'flex', gap: 4, justifyContent: 'center', zIndex: 6 }}>
                {allPhotos.map((_, i) => <div key={i} style={{ height: 3, flex: 1, maxWidth: 40, borderRadius: 2, background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />)}
              </div>
            )}

            {/* Gradient overlay */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)', pointerEvents: 'none' }} />

            {/* Info */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 16px', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>{profile.full_name?.split(' ')[0]}</span>
                {profile.age && <span style={{ color: '#fff', fontSize: 20, fontWeight: 400 }}>{profile.age}</span>}
                {profile.is_verified && <span style={{ fontSize: 16 }}>✓</span>}
                {profile.is_premium && <span style={{ background: '#f97316', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>VIP</span>}
              </div>
              {profile.bio && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, margin: '0 0 8px', lineHeight: 1.4 }}>{profile.bio.slice(0, 80)}{profile.bio.length > 80 ? '...' : ''}</p>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {profile.looking_for && <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                  {profile.looking_for === 'relationship' ? '💕 Dating' : profile.looking_for === 'friendship' ? '🤝 Friends' : profile.looking_for === 'casual' ? '😊 Casual' : '🌐 Network'}
                </span>}
                {profile.location_name && <span style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>📍 {profile.location_name}</span>}
                {(profile.interests || []).slice(0, 2).map((i: string) => <span key={i} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{i}</span>)}
              </div>
            </div>

            {/* Info button */}
            <button style={{ position: 'absolute', bottom: 16, right: 16, width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', background: 'transparent', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8 }}
              onClick={e => { e.stopPropagation(); router.push(`/profile/${profile.id}`) }}>ℹ</button>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: '12px 16px 4px', borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 56 }}>🌍</div>
            <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>You've seen everyone!</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>Check back later for new people</p>
            <button onClick={() => { setIndex(0); setProfiles(p => [...p]) }} style={{ marginTop: 8, padding: '12px 24px', borderRadius: 28, border: 'none', background: '#f97316', color: '#fff', fontWeight: 800, fontSize: 14 }}>🔄 Refresh</button>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {profile && (
        <div style={{ padding: '12px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <button onClick={handlePass} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #fee2e2', background: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(239,68,68,0.15)', transition: 'transform 0.15s' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')} onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>✕</button>
          <button onClick={() => router.push(`/chat/${profile.id}`)} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #e8e8e8', background: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💬</button>
          <button onClick={handleLike} style={{ width: 64, height: 64, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,#f97316,#ec4899)', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(249,115,22,0.4)', transition: 'transform 0.15s' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.92)')} onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>❤️</button>
          <button onClick={() => router.push(`/profile/${profile.id}`)} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #e8e8e8', background: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</button>
          <button onClick={() => router.push('/discover')} style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #dcfce7', background: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(34,197,94,0.15)' }}>⭐</button>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', display: 'flex', padding: '8px 0 max(8px,env(safe-area-inset-bottom))' }}>
        {[
          { icon: '💕', label: 'Discover', path: '/home' },
          { icon: '✉️', label: 'Matches', path: '/discover' },
          { icon: '💬', label: 'Chat', path: '/chat' },
          { icon: '👤', label: 'Profile', path: '/dashboard' },
        ].map(item => (
          <button key={item.path} onClick={() => router.push(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', padding: '4px 0', opacity: item.path === '/home' ? 1 : 0.5 }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: item.path === '/home' ? '#f97316' : '#94a3b8' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  return <Suspense fallback={<div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:40}}>💕</div></div>}><HomeContent/></Suspense>
}
