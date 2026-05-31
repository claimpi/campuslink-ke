'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function Stories({ myId }: { myId: string | null }) {
  const router = useRouter()
  const [stories, setStories] = useState<any[]>([])
  const [myStory, setMyStory] = useState<any>(null)
  const [viewing, setViewing] = useState<{ userId: string; stories: any[]; idx: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const progressRef = useRef<any>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    fetch('/api/stories').then(r => r.json()).then(({ stories }) => {
      if (!stories) return
      // Group by user
      const grouped: Record<string, any[]> = {}
      stories.forEach((s: any) => {
        if (!grouped[s.user_id]) grouped[s.user_id] = []
        grouped[s.user_id].push(s)
      })
      const users = Object.entries(grouped).map(([uid, ss]) => ({
        userId: uid, stories: ss, profile: ss[0].profiles
      }))
      setStories(users)
      if (myId) {
        const mine = users.find(u => u.userId === myId)
        setMyStory(mine || null)
      }
    })
  }, [myId])

  // Auto-advance story
  useEffect(() => {
    if (!viewing) return
    setProgress(0)
    clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressRef.current)
          // Go to next story
          const { userId, stories: ss, idx } = viewing
          if (idx + 1 < ss.length) {
            setViewing({ userId, stories: ss, idx: idx + 1 })
          } else {
            // Next user's stories
            const curIdx = stories.findIndex(s => s.userId === userId)
            if (curIdx + 1 < stories.length) {
              const next = stories[curIdx + 1]
              setViewing({ userId: next.userId, stories: next.stories, idx: 0 })
            } else {
              setViewing(null)
            }
          }
          return 0
        }
        return p + 2
      })
    }, 100)
    return () => clearInterval(progressRef.current)
  }, [viewing?.userId, viewing?.idx])

  async function uploadStory(file: File) {
    if (!myId) { router.push('/login'); return }
    setUploading(true)
    const sb = createClient()
    const ext = file.name.split('.').pop()
    const path = `stories/${myId}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)
    await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myId, mediaUrl: publicUrl }) })
    setUploading(false)
    window.location.reload()
  }

  return (
    <>
      {/* Story viewer overlay */}
      {viewing && (() => {
        const story = viewing.stories[viewing.idx]
        const prof = story.profiles
        return (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
            onClick={() => setViewing(null)}>
            {/* Progress bars */}
            <div style={{ display: 'flex', gap: 3, padding: '12px 12px 8px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
              {viewing.stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#fff', borderRadius: 2, width: i < viewing.idx ? '100%' : i === viewing.idx ? `${progress}%` : '0%', transition: i === viewing.idx ? 'none' : 'none' }} />
                </div>
              ))}
            </div>
            {/* Header */}
            <div style={{ position: 'absolute', top: 28, left: 0, right: 0, zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '2px solid #f97316' }}>
                {prof?.avatar_url ? <img src={prof.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <div style={{ width: '100%', height: '100%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{initials(prof?.full_name || '?')}</div>}
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>{prof?.full_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>
                  {Math.round((Date.now() - new Date(story.created_at).getTime()) / 3600000)}h ago
                </p>
              </div>
              <button onClick={() => setViewing(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            {/* Image */}
            <img src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" onClick={e => e.stopPropagation()} />
            {/* Caption */}
            {story.caption && (
              <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, padding: '12px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                <p style={{ color: '#fff', fontSize: 15, margin: 0, textAlign: 'center' }}>{story.caption}</p>
              </div>
            )}
            {/* Nav arrows */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%' }}
              onClick={e => { e.stopPropagation(); if (viewing.idx > 0) setViewing({ ...viewing, idx: viewing.idx - 1 }) }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%' }}
              onClick={e => { e.stopPropagation(); setViewing({ ...viewing, idx: Math.min(viewing.idx + 1, viewing.stories.length - 1) }) }} />
          </div>
        )
      })()}

      {/* Stories strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>

          {/* Add my story */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <label style={{ cursor: 'pointer', position: 'relative' }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: myStory ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#f1f5f9', border: myStory ? '2.5px solid #f97316' : '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {myStory ? <img src={myStory.stories[0]?.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : uploading ? <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTop: '2px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <span style={{ fontSize: 24, color: '#f97316' }}>+</span>}
              </div>
              {!myStory && !uploading && <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadStory(f) }} />}
            </label>
            <p style={{ fontSize: 10, color: '#64748b', margin: 0, maxWidth: 58, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {myStory ? 'My Story' : 'Add Story'}
            </p>
          </div>

          {/* Other users' stories */}
          {stories.filter(s => s.userId !== myId).map(user => {
            const prof = user.profile
            return (
              <div key={user.userId} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onClick={() => setViewing({ userId: user.userId, stories: user.stories, idx: 0 })}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #f97316', padding: 2, background: 'linear-gradient(135deg,#f97316,#ea580c)', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff' }}>
                    {prof?.avatar_url ? <img src={prof.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(prof?.full_name || '?')}</div>}
                  </div>
                </div>
                <p style={{ fontSize: 10, color: '#374151', margin: 0, maxWidth: 58, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {prof?.full_name?.split(' ')[0] || 'User'}
                </p>
              </div>
            )
          })}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  )
}
