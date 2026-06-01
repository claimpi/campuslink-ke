'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function ChatListPage() {
  const router = useRouter()
  const [me, setMe] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await sb.from('profiles').select('id,full_name,coins,free_messages_used').eq('id', user.id).maybeSingle()
      setMe(profile)

      // Get latest message per conversation
      const { data: msgs } = await sb.from('messages')
        .select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false }).limit(200)

      if (!msgs) { setLoading(false); return }

      // Group by conversation partner
      const seen = new Set<string>()
      const convos: any[] = []
      for (const msg of msgs) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!seen.has(partnerId)) {
          seen.add(partnerId)
          convos.push({ ...msg, partnerId })
        }
      }

      // Fetch partner profiles
      if (convos.length > 0) {
        const ids = convos.map(c => c.partnerId)
        const { data: profiles } = await sb.from('profiles').select('id,full_name,avatar_url,last_seen').in('id', ids)
        const profileMap: Record<string, any> = {}
        profiles?.forEach((p: any) => profileMap[p.id] = p)
        setConversations(convos.map(c => ({ ...c, partner: profileMap[c.partnerId] })))
      }
      setLoading(false)
    })
  }, [])

  function timeAgo(ts: string) {
    const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
    if (m < 1) return 'now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  const freeLeft = Math.max(0, 10 - (me?.free_messages_used || 0))

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#f5f6fa', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Messages</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{conversations.length} conversations</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div onClick={() => router.push('/pricing')} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>🪙</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f97316' }}>{me?.coins || 0}</span>
          </div>
        </div>
      </div>

      {/* Free messages banner */}
      {freeLeft > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>🎉 {freeLeft} free messages left</span>
          <span style={{ fontSize: 11, opacity: 0.85 }}>Then 5 coins/msg</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #fed7aa', borderTop: '3px solid #f97316', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : conversations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No messages yet</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Send a Hi to someone to start chatting</p>
          <button onClick={() => router.push('/discover')} style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Find People
          </button>
        </div>
      ) : (
        <div>
          {conversations.map(c => {
            const unread = !c.read_at && c.receiver_id === me?.id
            return (
              <div key={c.partnerId} onClick={() => router.push(`/chat/${c.partnerId}`)}
                style={{ background: '#fff', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {c.partner?.avatar_url
                    ? <img src={c.partner.avatar_url} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    : <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                        {c.partner?.full_name?.[0] || '?'}
                      </div>
                  }
                  {/* Online dot */}
                  {c.partner?.last_seen && (Date.now() - new Date(c.partner.last_seen).getTime()) / 60000 < 5 && (
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid #fff' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: unread ? 800 : 600, fontSize: 15, color: '#0f172a' }}>{c.partner?.full_name || 'User'}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(c.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: unread ? '#0f172a' : '#94a3b8', fontWeight: unread ? 600 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.sender_id === me?.id ? '▶ ' : ''}{c.content}
                  </p>
                </div>
                {unread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
