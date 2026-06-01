'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const ICONS: Record<string, string> = {
  like: '❤️', match: '💞', follow: '👤',
  daily_reward: '🎁', gift: '🎁', message: '💬',
 coin_transfer: '🪙', referral: '🪙'
}

function timeAgo(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      // Load notifications
      sb.from('notifications')
        .select('*, profiles!notifications_from_user_id_fkey(full_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setNotifs(data || [])
          setUnread((data || []).filter((n: any) => !n.read).length)
          setLoading(false)
          // Mark all as read
          sb.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false).then(() => {})
        })

      // Realtime
      const channel = sb.channel('notifs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
          setNotifs(p => [payload.new, ...p])
          setUnread(u => u + 1)
        }).subscribe()
      return () => { sb.removeChannel(channel) }
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #fed7aa', borderTop: '3px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#f5f6fa', minHeight: '100vh', paddingBottom: 80 }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '16px', borderBottom: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{notifs.length} total</p>
        </div>
        {unread > 0 && (
          <div style={{ background: '#f97316', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            {unread} new
          </div>
        )}
      </div>

      {notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No notifications yet</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Likes, follows and rewards will appear here</p>
        </div>
      ) : (
        <div>
          {notifs.map((n: any) => {
            const prof = n.profiles
            const icon = ICONS[n.type] || '🔔'
            const isUnread = !n.read
            return (
              <div key={n.id} onClick={() => n.url && router.push(n.url)}
                style={{ background: isUnread ? '#fff7ed' : '#fff', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'center', cursor: n.url ? 'pointer' : 'default' }}>

                {/* Avatar or icon */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {prof?.avatar_url ? (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                      <img src={prof.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    </div>
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {icon}
                    </div>
                  )}
                  {/* Type badge */}
                  {prof?.avatar_url && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, border: '1px solid #e2e8f0' }}>
                      {icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: '#0f172a', margin: '0 0 2px', lineHeight: 1.4 }}>{n.title}</p>
                  {n.body && <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{n.body}</p>}
                </div>

                {/* Time + unread dot */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{timeAgo(n.created_at)}</span>
                  {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316' }} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
