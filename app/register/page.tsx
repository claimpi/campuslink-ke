'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const INTERESTS = ['Music','Travel','Food','Fitness','Movies','Reading','Gaming','Art','Fashion','Football','Dancing','Photography','Cooking','Tech','Nature']

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [f, setF] = useState({ name:'', email:'', password:'', age:'', gender:'', want:'', bio:'' })
  const [interests, setInterests] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const up = (k:string) => (v:string) => setF(x => ({ ...x, [k]: v }))
  const pct = step / 4 * 100

  async function s1(e:any) {
    e.preventDefault(); setErr(''); setBusy(true)
    if (!f.name.trim() || !f.email.trim() || f.password.length < 6) { setErr('Fill all fields. Password min 6 chars.'); setBusy(false); return }
    const { error } = await createClient().auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } })
    if (error) { setErr(error.message); setBusy(false); return }
    setBusy(false); setStep(2)
  }

  function s2(e:any) {
    e.preventDefault(); setErr('')
    if (!f.age || !f.gender || !f.want) { setErr('Please fill all fields'); return }
    setStep(3)
  }

  async function uploadPhoto(file: File) {
    if (photos.length >= 6) return
    setUploading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setUploading(false); return }
    const path = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setErr('Upload failed: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)
    setPhotos(p => [...p, publicUrl])
    setUploading(false)
  }

  async function finish() {
    if (photos.length < 1) { setErr('Add at least 1 photo'); return }
    setBusy(true); setErr('')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    const code = user.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    const { error } = await sb.from('profiles').upsert({
      id: user.id, email: user.email, full_name: f.name,
      avatar_url: photos[0], photos: photos.slice(1),
      age: parseInt(f.age), gender: f.gender, looking_for: f.want,
      bio: f.bio, interests, referral_code: code, coins: 20,
    }, { onConflict: 'id' })
    if (error) { setErr(error.message); setBusy(false); return }
    // Handle referral
    const ref = localStorage.getItem('ref_code')
    if (ref) {
      const { data: referrer } = await sb.from('profiles').select('id,coins').eq('referral_code', ref.toUpperCase()).maybeSingle()
      if (referrer && referrer.id !== user.id) {
        await sb.from('profiles').update({ coins: (referrer.coins || 0) + 50 }).eq('id', referrer.id)
        await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)
        try { await sb.from('referrals').insert([{ referrer_id: referrer.id, referred_id: user.id, amount: 50, status: 'credited' }]) } catch {}
        localStorage.removeItem('ref_code')
      }
    }
    setBusy(false)
    router.replace('/home?new=true')
  }

  const tog = (i: string) => setInterests(x => x.includes(i) ? x.filter(v => v !== i) : x.length < 5 ? [...x, i] : x)

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Progress header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>}
        <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#f43f5e,#ec4899)', borderRadius: 2, width: `${pct}%`, transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>{step}/4</span>
      </div>

      <div style={{ flex: 1, padding: '24px 24px 36px', overflowY: 'auto' }}>

        {/* STEP 1 — Account */}
        {step === 1 && (
          <form onSubmit={s1} className="fu" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Heading title="Create Account 👋" sub="Join free and start connecting" />
            <FInp label="Full Name" type="text" value={f.name} onChange={up('name')} placeholder="e.g. Amina Wanjiru" autoFocus />
            <FInp label="Email" type="email" value={f.email} onChange={up('email')} placeholder="you@gmail.com" />
            <FInp label="Password" type="password" value={f.password} onChange={up('password')} placeholder="Min 6 characters" />
            {err && <Err>{err}</Err>}
            <Btn busy={busy}>Continue →</Btn>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Already have an account?{' '}
              <span onClick={() => router.push('/login')} style={{ color: '#f43f5e', fontWeight: 700, cursor: 'pointer' }}>Sign In</span>
            </p>
          </form>
        )}

        {/* STEP 2 — Basics */}
        {step === 2 && (
          <form onSubmit={s2} className="fu" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Heading title="About You 🙋" sub="Help us find your perfect match" />
            <FInp label="Your Age" type="number" value={f.age} onChange={up('age')} placeholder="e.g. 22" min="16" max="60" />
            <div>
              <Label>I am a</Label>
              <Grid2 mt={10}>
                {[['male','👨 Man'],['female','👩 Woman']].map(([v,l]) => (
                  <Pick key={v} active={f.gender===v} onClick={() => up('gender')(v)} color="#f43f5e">{l}</Pick>
                ))}
              </Grid2>
            </div>
            <div>
              <Label>Looking for</Label>
              <Grid2 mt={10}>
                {[['relationship','💕 Dating'],['friendship','🤝 Friends'],['casual','😊 Casual'],['networking','🌐 Network']].map(([v,l]) => (
                  <Pick key={v} active={f.want===v} onClick={() => up('want')(v)} color="#8b5cf6">{l}</Pick>
                ))}
              </Grid2>
            </div>
            {err && <Err>{err}</Err>}
            <Btn>Continue →</Btn>
          </form>
        )}

        {/* STEP 3 — Photos */}
        {step === 3 && (
          <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Heading title="Add Photos 📸" sub="Profiles with photos get 10× more matches. First photo = main." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[...Array(6)].map((_, idx) => {
                const photo = photos[idx]
                return (
                  <div key={idx}
                    onClick={() => !photo && fileRef.current?.click()}
                    style={{ aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', border: `2px ${photo ? 'solid #f43f5e' : 'dashed #d1d5db'}`, background: '#f9fafb', position: 'relative', cursor: photo ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photo ? (
                      <>
                        <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        <button onClick={e => { e.stopPropagation(); setPhotos(p => p.filter((_, j) => j !== idx)) }}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        {idx === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(244,63,94,0.85)', color: '#fff', fontSize: 9, fontWeight: 900, textAlign: 'center', padding: '3px 0', letterSpacing: '0.5px' }}>MAIN</div>}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {uploading && idx === photos.length
                          ? <div className="spin" style={{ width: 20, height: 20, border: '2.5px solid #f43f5e', borderTopColor: 'transparent', borderRadius: '50%' }} />
                          : <span style={{ fontSize: 28, color: '#d1d5db' }}>+</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); e.target.value = '' }} />
            {err && <Err>{err}</Err>}
            <Btn onClick={() => { if (photos.length === 0) { setErr('Add at least 1 photo'); return } setStep(4) }} type="button" busy={uploading}>
              {photos.length === 0 ? 'Add a Photo First' : `Continue with ${photos.length} photo${photos.length > 1 ? 's' : ''} →`}
            </Btn>
          </div>
        )}

        {/* STEP 4 — Bio + Interests */}
        {step === 4 && (
          <div className="fu" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Heading title="Final Touch ✨" sub="Tell people what makes you unique" />
            <div>
              <Label>Bio <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></Label>
              <textarea value={f.bio} onChange={e => up('bio')(e.target.value)} placeholder="Say something about yourself..." rows={3}
                style={{ width: '100%', marginTop: 8, border: '1.5px solid #e5e7eb', borderRadius: 14, padding: '12px 14px', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#f43f5e'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            </div>
            <div>
              <Label>Interests <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 12 }}>— up to 5 ({interests.length}/5)</span></Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {INTERESTS.map(i => (
                  <button key={i} type="button" onClick={() => tog(i)}
                    style={{ padding: '8px 14px', borderRadius: 50, border: `1.5px solid ${interests.includes(i) ? '#f43f5e' : '#e5e7eb'}`, background: interests.includes(i) ? '#fff1f2' : '#fff', color: interests.includes(i) ? '#f43f5e' : '#6b7280', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            {err && <Err>{err}</Err>}
            <Btn onClick={finish} type="button" busy={busy}>🎉 Start Matching!</Btn>
          </div>
        )}
      </div>
    </div>
  )
}

function Heading({ title, sub }: any) {
  return <div style={{ marginBottom: 4 }}><h1 style={{ fontSize: 26, fontWeight: 900, color: '#111', marginBottom: 5, letterSpacing: '-0.3px' }}>{title}</h1><p style={{ color: '#9ca3af', fontSize: 14 }}>{sub}</p></div>
}
function Label({ children }: any) { return <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block' }}>{children}</label> }
function Err({ children }: any) { return <p style={{ color: '#ef4444', fontSize: 13, background: '#fef2f2', padding: '10px 14px', borderRadius: 10 }}>{children}</p> }
function Grid2({ children, mt }: any) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: mt || 0 }}>{children}</div> }
function Pick({ children, active, onClick, color }: any) {
  return <button type="button" onClick={onClick} style={{ padding: '13px', borderRadius: 14, border: `2px solid ${active ? color : '#e5e7eb'}`, background: active ? `${color}14` : '#fff', color: active ? color : '#6b7280', fontSize: 14, fontWeight: 700, transition: 'all 0.2s' }}>{children}</button>
}
function FInp({ label, ...props }: any) {
  const [f, setF] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <input {...props} onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ width: '100%', border: `1.5px solid ${f ? '#f43f5e' : '#e5e7eb'}`, borderRadius: 14, padding: '13px 16px', fontSize: 15, outline: 'none', transition: 'border 0.2s', background: '#fff' }} />
    </div>
  )
}
function Btn({ children, busy, onClick, type = 'submit' }: any) {
  return (
    <button type={type} onClick={onClick} disabled={busy}
      style={{ width: '100%', padding: '16px', borderRadius: 50, border: 'none', background: busy ? '#f3f4f6' : 'linear-gradient(135deg,#f43f5e,#ec4899)', color: busy ? '#9ca3af' : '#fff', fontSize: 16, fontWeight: 900, boxShadow: busy ? 'none' : '0 4px 20px rgba(244,63,94,0.3)', transition: 'all 0.2s' }}>
      {busy ? <span className="spin" style={{ display: 'inline-block', width: 20, height: 20, border: '2.5px solid #d1d5db', borderTopColor: '#9ca3af', borderRadius: '50%', verticalAlign: 'middle' }} /> : children}
    </button>
  )
}
