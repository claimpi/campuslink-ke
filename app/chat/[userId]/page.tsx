'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { detectViolation, VIOLATION_MESSAGES } from '@/lib/content-filter'
import { Suspense } from 'react'

const FREE_MSGS = 10
const COINS_PER_MSG = 5

function ChatInner() {
  const { userId: otherId } = useParams<{ userId: string }>()
  const router = useRouter()
  const sp = useSearchParams()
  const storyReplyUrl = sp.get('storyReply') ? decodeURIComponent(sp.get('storyReply')!) : null
  const storyReplyCaption = sp.get('storyCaption') ? decodeURIComponent(sp.get('storyCaption')!) : null
  const [me, setMe] = useState<any>(null)
  const [other, setOther] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showCoinTransfer, setShowCoinTransfer] = useState(false)
  const [coinAmount, setCoinAmount] = useState('')
  const [coins, setCoins] = useState(0)
  const [error, setError] = useState('')
  const [policyViolation, setPolicyViolation] = useState<{reason:string,message:string}|null>(null)
  const [showBuy, setShowBuy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pre-fill reply text when coming from a story reply
  useEffect(() => {
    if (storyReplyUrl) setText('Replied to your story 👆')
  }, [storyReplyUrl])

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      sb.from('profiles').select('id,full_name,avatar_url,coins,free_messages_used').eq('id', user.id).maybeSingle()
        .then(({ data }) => { setMe(data); setCoins(data?.coins || 0) })
      sb.from('profiles').select('id,full_name,avatar_url,is_premium,is_verified,last_seen').eq('id', otherId).maybeSingle()
        .then(({ data }) => setOther(data))

      // Load existing messages - use two separate queries and merge
      const loadMessages = async () => {
        const [{ data: sent }, { data: received }] = await Promise.all([
          sb.from('messages').select('*')
            .eq('sender_id', user.id).eq('receiver_id', otherId)
            .order('created_at', { ascending: true }).limit(100),
          sb.from('messages').select('*')
            .eq('sender_id', otherId).eq('receiver_id', user.id)
            .order('created_at', { ascending: true }).limit(100),
        ])
        const all = [...(sent || []), ...(received || [])]
        all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        setMessages(all)
      }
      loadMessages()

      // Mark messages as read
      sb.from('messages').update({ read_at: new Date().toISOString() })
        .eq('receiver_id', user.id).eq('sender_id', otherId).is('read_at', null)
        .then(() => {})

      // Realtime subscription
      const channel = sb.channel(`chat-${[user.id, otherId].sort().join('-')}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
          const msg = payload.new as any
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherId) ||
            (msg.sender_id === otherId && msg.receiver_id === user.id)
          ) {
            setMessages(p => {
              // avoid duplicates
              if (p.find(m => m.id === msg.id)) return p
              return [...p, msg]
            })
            // mark as read if received
            if (msg.receiver_id === user.id) {
              sb.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id).then(() => {})
            }
          }
        }).subscribe()
      return () => { sb.removeChannel(channel) }
    })
  }, [otherId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || !me || sending) return

    // Client-side content check first (fast, no network)
    const violation = detectViolation(text)
    if (violation.blocked) {
      setPolicyViolation({ reason: violation.reason, message: VIOLATION_MESSAGES[violation.reason] || VIOLATION_MESSAGES.contact_sharing })
      return
    }

    // If replying to story, prepend story context in message
    const finalContent = storyReplyUrl
      ? `[story_reply:${storyReplyUrl}]\n${text.trim()}`
      : text.trim()

    setSending(true); setError('')
    const res = await fetch('/api/message', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: me.id, receiverId: otherId, content: finalContent })
    })
    const data = await res.json()
    if (data.error === 'content_violation') {
      setPolicyViolation({ reason: data.reason, message: data.message })
      setSending(false); return
    }
    if (data.error === 'insufficient_coins') {
      setError(`You need ${COINS_PER_MSG} coins to send a message. You have ${data.coinsHave}.`)
      setShowBuy(true)
      setSending(false); return
    }
    if (!data.success) { setError(data.error || 'Failed'); setSending(false); return }
    setText('')
    if (storyReplyUrl) router.replace(`/chat/${otherId}`)
    // Update local coin count
    setMe((p: any) => ({ ...p, coins: data.coinsLeft, free_messages_used: p.free_messages_used + (data.isFree ? 1 : 0) }))
    setSending(false)
  }

  const freeLeft = Math.max(0, FREE_MSGS - (me?.free_messages_used || 0))

  function formatTime(ts: string) {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  }
  function isOnline(ts: string | null) {
    if (!ts) return false
    return (Date.now() - new Date(ts).getTime()) / 60000 < 5
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f5f6fa' }}>

      {/* Policy violation popup */}
      {policyViolation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🚫</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Message Blocked</h3>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>{policyViolation.message}</p>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 6px' }}>CampusLink Policy</p>
              <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>
                To keep our community safe, sharing phone numbers, social handles, bank accounts, or email addresses in chat is not allowed. Use our built-in features to connect safely.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPolicyViolation(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Got it
              </button>
              <button onClick={() => { setPolicyViolation(null); router.push('/pricing') }}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                🪙 Send Coins
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #e8ecf0', flexShrink: 0 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '0 4px', color: '#374151' }}>←</button>
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => router.push(`/profile/${otherId}`)}>
          {other?.avatar_url
            ? <img src={other.avatar_url} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} alt="" />
            : <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{other?.full_name?.[0] || '?'}</div>
          }
          <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: isOnline(other?.last_seen) ? '#22c55e' : '#d1d5db', border: '2px solid #fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: 0 }}>{other?.full_name || 'Loading...'}</p>
          <p style={{ fontSize: 11, color: isOnline(other?.last_seen) ? '#22c55e' : '#94a3b8', margin: 0 }}>
            {isOnline(other?.last_seen) ? 'Online now' : 'Offline'}
          </p>
        </div>
        {/* Coin balance */}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => router.push('/pricing')}>
          <span style={{ fontSize: 14 }}>🪙</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316' }}>{coins}</span>
        </div>
      </div>

      {/* Free messages banner */}
      {freeLeft > 0 && (
        <div style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          🎉 {freeLeft} free message{freeLeft !== 1 ? 's' : ''} remaining — then 5 coins/message
        </div>
      )}
      {freeLeft === 0 && (
        <div style={{ background: '#fff7ed', borderBottom: '1px solid #fed7aa', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>🪙 {coins} coins · 5 coins/message</span>
          <button onClick={() => router.push('/pricing')} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 12, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Buy Coins</button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', margin: 'auto', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
            <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Say hello to {other?.full_name?.split(' ')[0]}!</p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>You have {freeLeft} free messages to start</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.sender_id === me?.id
          return (
            <div key={msg.id || i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
              {!isMine && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  {other?.avatar_url
                    ? <img src={other.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : <div style={{ width: '100%', height: '100%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{other?.full_name?.[0]}</div>
                  }
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  background: isMine ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#fff',
                  color: isMine ? '#fff' : '#0f172a',
                  padding: msg.content?.startsWith('[story_reply:') ? '6px' : '10px 14px',
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  fontSize: 14, lineHeight: 1.5,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  overflow: 'hidden'
                }}>
                  {msg.content?.startsWith('[story_reply:') ? (() => {
                    const match = msg.content.match(/^\[story_reply:(.*?)\]\n?(.*)/s)
                    const imgUrl = match?.[1] || ''
                    const replyText = match?.[2] || ''
                    return (
                      <div>
                        {/* Story image highlight */}
                        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: replyText ? 6 : 0 }}>
                          <img src={imgUrl} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} alt="story" />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                          <div style={{ position: 'absolute', top: 6, left: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '2px 8px' }}>
                            <span style={{ color: '#fff', fontSize: 10, fontWeight: 600 }}>↩ Story</span>
                          </div>
                        </div>
                        {replyText && <div style={{ padding: '2px 8px 4px', fontSize: 13 }}>{replyText}</div>}
                      </div>
                    )
                  })() : msg.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{formatTime(msg.created_at)}</span>
                  {isMine && msg.is_free && <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 600 }}>FREE</span>}
                  {isMine && !msg.is_free && <span style={{ fontSize: 9, color: '#f97316', fontWeight: 600 }}>🪙5</span>}
                  {isMine && msg.read_at && <span style={{ fontSize: 10, color: '#22c55e' }}>✓✓</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', margin: '0 12px', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626', flexShrink: 0 }}>
          {error}
          {showBuy && <button onClick={() => router.push('/pricing')} style={{ marginLeft: 8, background: '#f97316', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Buy Coins</button>}
        </div>
      )}

      {/* Story reply banner */}
      {storyReplyUrl && (
        <div style={{ background: '#fff7ed', borderTop: '1px solid #fed7aa', padding: '8px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '2px solid #f97316' }}>
            <img src={storyReplyUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="story" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f97316', margin: '0 0 2px' }}>↩ Replying to story</p>
            {storyReplyCaption && <p style={{ fontSize: 11, color: '#92400e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storyReplyCaption}</p>}
          </div>
          <button onClick={() => router.replace(`/chat/${otherId}`)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Quick actions bar */}
      <div style={{ background: '#fff', padding: '6px 12px', display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', flexShrink: 0, overflowX: 'auto' }}>
        {/* Request gift */}
        <button onClick={async () => {
          if (!me) return
          const msg = `🎁 Can you send me a gift? Visit my profile!`
          await fetch('/api/message', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: me.id, receiverId: otherId, content: msg }) })
        }} style={{ flexShrink: 0, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#f97316', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          🎁 Request Gift
        </button>
        {/* Send coins */}
        <button onClick={() => setShowCoinTransfer(s => !s)} style={{ flexShrink: 0, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#16a34a', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          🪙 Send Coins
        </button>
        {/* View profile */}
        <button onClick={() => router.push(`/profile/${otherId}`)} style={{ flexShrink: 0, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          👤 Profile
        </button>
      </div>

      {/* Coin transfer panel */}
      {showCoinTransfer && (
        <div style={{ background: '#fff', padding: '12px 16px', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🪙 Send Coins to {other?.full_name?.split(' ')[0]}</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Balance: {coins} coins</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {[10, 20, 50, 100].map(a => (
              <button key={a} onClick={() => setCoinAmount(String(a))} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1.5px solid ${coinAmount === String(a) ? '#f97316' : '#e2e8f0'}`, background: coinAmount === String(a) ? '#fff7ed' : '#fff', color: coinAmount === String(a) ? '#f97316' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {a}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={coinAmount} onChange={e => setCoinAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="Amount..." style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            <button onClick={async () => {
              if (!me || !coinAmount) return
              const amt = parseInt(coinAmount)
              if (amt > coins) { setError(`Not enough coins (have ${coins})`); return }
              setSending(true)
              const res = await fetch('/api/transfer-coins', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: me.id, receiverId: otherId, amount: amt, message: `Sent from chat` }) })
              const data = await res.json()
              if (data.success) {
                setMe((p: any) => ({ ...p, coins: data.senderCoins }))
                setCoins(data.senderCoins)
                setCoinAmount('')
                setShowCoinTransfer(false)
                // Send a message about the transfer
                await fetch('/api/message', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ senderId: me.id, receiverId: otherId, content: `🪙 I just sent you ${amt} coins!` }) })
              } else { setError(data.error || 'Transfer failed') }
              setSending(false)
            }} disabled={!coinAmount || sending} style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Send 🪙
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ background: '#fff', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #e8ecf0', flexShrink: 0 }}>
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={freeLeft > 0 ? `Message (${freeLeft} free left)...` : `Message (🪙 5 coins)...`}
          style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 22, padding: '10px 16px', fontSize: 14, outline: 'none', background: '#f8fafc' }}
          onFocus={e => e.target.style.borderColor = '#f97316'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: !text.trim() || sending ? 'not-allowed' : 'pointer',
          background: !text.trim() || sending ? '#e2e8f0' : 'linear-gradient(135deg,#f97316,#ea580c)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: text.trim() ? '0 2px 8px rgba(249,115,22,0.4)' : 'none', transition: 'all 0.2s'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh'}}>
        <div style={{width:36,height:36,border:'3px solid #fed7aa',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ChatInner/>
    </Suspense>
  )
}
