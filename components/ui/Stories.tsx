'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function Stories({ myId }: { myId: string | null }) {
  const router = useRouter()
  const [stories, setStories] = useState<any[]>([])
  const [viewing, setViewing] = useState<{ userId: string; stories: any[]; idx: number } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [storyLikes, setStoryLikes] = useState<Set<string>>(new Set())
  const [likingId, setLikingId] = useState<string|null>(null)
  const progressRef = useRef<any>(null)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  function loadStories() {
    fetch('/api/stories').then(r => r.json()).then(({ stories: raw }) => {
      if (!raw) return
      const grouped: Record<string, any[]> = {}
      raw.forEach((s: any) => {
        if (!grouped[s.user_id]) grouped[s.user_id] = []
        grouped[s.user_id].push(s)
      })
      // My story first, then others
      const users = Object.entries(grouped).map(([uid, ss]) => ({
        userId: uid, stories: ss, profile: ss[0].profiles
      }))
      users.sort((a, b) => a.userId === myId ? -1 : b.userId === myId ? 1 : 0)
      setStories(users)
    })
  }

  useEffect(() => { loadStories() }, [myId])

  // Auto-advance (images only — videos self-advance via onEnded)
  useEffect(() => {
    if (!viewing) return
    const story = viewing.stories[viewing.idx]
    const isVideo = story?.media_url?.match(/\.(mp4|mov|webm|ogg)$/i)
    if (isVideo) { setProgress(0); clearInterval(progressRef.current); return }

    setProgress(0)
    clearInterval(progressRef.current)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(progressRef.current); advanceStory(); return 0 }
        return p + (100/50) // 5 seconds
      })
    }, 100)
    return () => clearInterval(progressRef.current)
  }, [viewing?.userId, viewing?.idx])

  function advanceStory() {
    if (!viewing) return
    const { userId, stories: ss, idx } = viewing
    if (idx + 1 < ss.length) {
      setViewing({ userId, stories: ss, idx: idx + 1 })
    } else {
      const curIdx = stories.findIndex(s => s.userId === userId)
      if (curIdx + 1 < stories.length) {
        const next = stories[curIdx + 1]
        setViewing({ userId: next.userId, stories: next.stories, idx: 0 })
      } else {
        setViewing(null)
      }
    }
  }

  async function likeStory(storyId: string) {
    if (!myId) { router.push('/login'); return }
    if (storyLikes.has(storyId) || likingId) return
    setLikingId(storyId)
    const sb = createClient()
    await sb.from('story_views').upsert([{ story_id: storyId, viewer_id: myId }], { onConflict: 'story_id,viewer_id' })
    // Increment likes count
    const story = viewing?.stories[viewing.idx]
    if (story) {
      await sb.from('stories').update({ views: (story.views || 0) + 1 }).eq('id', storyId)
      setViewing(v => v ? { ...v, stories: v.stories.map((s:any) => s.id === storyId ? { ...s, views: (s.views||0)+1 } : s) } : v)
    }
    setStoryLikes(p => new Set([...p, storyId]))
    setLikingId(null)
  }

  async function deleteStory(storyId: string) {
    if (!myId) return
    const sb = createClient()
    await sb.from('stories').delete().eq('id', storyId).eq('user_id', myId)
    setViewing(null)
    loadStories()
  }

  async function uploadStory(file: File) {
    if (!myId) { router.push('/login'); return }
    if (file.size > 20 * 1024 * 1024) { alert('File too large. Max 20MB.'); return }
    setUploading(true)
    const sb = createClient()
    const ext = file.name.split('.').pop()
    const path = `stories/${myId}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)
    await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: myId, mediaUrl: publicUrl }) })
    setUploading(false)
    loadStories()
  }

  const myStoryUser = stories.find(s => s.userId === myId)
  const isVideo = (url: string) => /\.(mp4|mov|webm|ogg)$/i.test(url)

  return (
    <>
      {/* Story viewer */}
      {viewing && (() => {
        const story = viewing.stories[viewing.idx]
        const prof = story.profiles
        const isOwner = story.user_id === myId
        const isLiked = storyLikes.has(story.id)
        const vid = isVideo(story.media_url)

        return (
          <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
            {/* Progress bars */}
            <div style={{ display: 'flex', gap: 3, padding: '10px 10px 0', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
              {viewing.stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#fff', borderRadius: 2, width: i < viewing.idx ? '100%' : i === viewing.idx && !vid ? `${progress}%` : i === viewing.idx && vid ? '0%' : '0%' }} />
                </div>
              ))}
            </div>

            {/* Header */}
            <div style={{ position: 'absolute', top: 20, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid #f97316', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => { setViewing(null); router.push(`/profile/${story.user_id}`) }}>
                {prof?.avatar_url
                  ? <img src={prof.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : <div style={{ width: '100%', height: '100%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(prof?.full_name||'?')}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0 }}>{prof?.full_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: 0 }}>
                  {Math.max(0,Math.round((Date.now()-new Date(story.created_at).getTime())/3600000))}h ago
                  {story.views > 0 && <span> · 👁 {story.views}</span>}
                </p>
              </div>
              {/* Delete (owner only) */}
              {isOwner && (
                <button onClick={() => { if(confirm('Delete this story?')) deleteStory(story.id) }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 20, padding: '4px 10px', fontSize: 11, cursor: 'pointer', marginRight: 4 }}>
                  🗑 Delete
                </button>
              )}
              <button onClick={() => setViewing(null)}
                style={{ background: 'rgba(0,0,0,0.4)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Media */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {vid
                ? <video ref={videoRef} src={story.media_url} autoPlay playsInline controls={false}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onEnded={advanceStory}
                    onLoadStart={() => setProgress(0)} />
                : <img src={story.media_url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
              }
            </div>

            {/* Caption */}
            {story.caption && (
              <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, padding: '20px', background: 'linear-gradient(to top,rgba(0,0,0,0.65),transparent)' }}>
                <p style={{ color: '#fff', fontSize: 14, margin: 0, textAlign: 'center' }}>{story.caption}</p>
              </div>
            )}

            {/* Bottom actions */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 24px', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
              {/* Like button */}
              {!isOwner && (
                <button onClick={() => likeStory(story.id)}
                  style={{ background: isLiked ? 'rgba(236,72,153,0.9)' : 'rgba(255,255,255,0.15)', border: `1.5px solid ${isLiked ? '#ec4899' : 'rgba(255,255,255,0.4)'}`, color: '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)' }}>
                  {isLiked ? '❤️' : '🤍'} {isLiked ? 'Liked' : 'Like'}
                </button>
              )}
              {/* Chat */}
              {!isOwner && (
                <button onClick={() => { setViewing(null); router.push(`/chat/${story.user_id}`) }}
                  style={{ background: 'rgba(249,115,22,0.9)', border: 'none', color: '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  💬 Reply
                </button>
              )}
              {/* Owner sees views */}
              {isOwner && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  <span>👁</span><span>{story.views || 0} views</span>
                </div>
              )}
            </div>

            {/* Nav tap zones */}
            <div style={{ position: 'absolute', top: 60, left: 0, width: '35%', height: '70%', zIndex: 2 }}
              onClick={e => { e.stopPropagation(); if(viewing.idx > 0) setViewing({...viewing, idx: viewing.idx-1}); else setViewing(null) }} />
            <div style={{ position: 'absolute', top: 60, right: 0, width: '35%', height: '70%', zIndex: 2 }}
              onClick={e => { e.stopPropagation(); advanceStory() }} />
          </div>
        )
      })()}

      {/* Stories strip */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>

          {/* Add story / My story */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            {myStoryUser
              ? <div style={{ position: 'relative', cursor: 'pointer' }}
                  onClick={() => setViewing({ userId: myId!, stories: myStoryUser.stories, idx: 0 })}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #f97316', padding: 2 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff' }}>
                      {myStoryUser.profile?.avatar_url
                        ? <img src={myStoryUser.profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <div style={{ width: '100%', height: '100%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(myStoryUser.profile?.full_name||'?')}</div>}
                    </div>
                  </div>
                  {/* + to add another */}
                  <label style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#f97316', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                    +<input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) uploadStory(f) }} />
                  </label>
                </div>
              : <label style={{ cursor: myId ? 'pointer' : 'default' }} onClick={() => !myId && router.push('/login')}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#f1f5f9', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {uploading
                      ? <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTop: '2px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <span style={{ fontSize: 22, color: '#f97316' }}>+</span>}
                  </div>
                  {myId && !uploading && <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) uploadStory(f) }} />}
                </label>
            }
            <p style={{ fontSize: 10, color: myId ? '#374151' : '#94a3b8', margin: 0, textAlign: 'center', fontWeight: 600 }}>
              {myStoryUser ? 'My Story' : myId ? 'Add Story' : '🔒 Story'}
            </p>
          </div>

          {/* Other users */}
          {stories.filter(s => s.userId !== myId).map(user => {
            const prof = user.profile
            return (
              <div key={user.userId} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                onClick={() => setViewing({ userId: user.userId, stories: user.stories, idx: 0 })}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', padding: 2, background: 'linear-gradient(135deg,#f97316,#ea580c)', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fff' }}>
                    {prof?.avatar_url
                      ? <img src={prof.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{initials(prof?.full_name||'?')}</div>}
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
