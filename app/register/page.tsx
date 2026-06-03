'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const INTERESTS = ['Music','Travel','Food','Fitness','Movies','Reading','Gaming','Art','Fashion','Football','Dancing','Photography','Cooking','Hiking','Tech']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=account, 2=basics, 3=photos, 4=about
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', gender: '', looking_for: '', bio: '', interests: [] as string[] })
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Check ref code
  useEffect(() => {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)ref_code=([^;]+)/)
    const fromStorage = localStorage.getItem('ref_code')
    if (!fromStorage && cookieMatch) localStorage.setItem('ref_code', decodeURIComponent(cookieMatch[1]))
  }, [])

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleStep1(e: any) {
    e.preventDefault()
    setError(''); setLoading(true)
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Please fill all fields. Password must be 6+ characters.'); setLoading(false); return
    }
    const sb = createClient()
    const { error } = await sb.auth.signUp({ email: form.email, password: form.password, options: { data: { full_name: form.name } } })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false); setStep(2)
  }

  async function handleStep2(e: any) {
    e.preventDefault()
    if (!form.age || !form.gender || !form.looking_for) { setError('Please fill all fields'); return }
    setError(''); setStep(3)
  }

  async function uploadPhoto(file: File) {
    if (photos.length >= 6) { setError('Max 6 photos'); return }
    setUploading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}/${Date.now()}.${ext}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setError('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)
    setPhotos(p => [...p, publicUrl])
    setUploading(false)
  }

  async function handleFinish() {
    if (photos.length < 1) { setError('Add at least 1 photo'); return }
    setLoading(true); setError('')
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    const refCode = localStorage.getItem('ref_code')
    const genCode = user.id.replace(/-/g, '').substring(0, 8).toUpperCase()

    await sb.from('profiles').upsert({
      id: user.id, email: user.email, full_name: form.name,
      avatar_url: photos[0], photos: photos.slice(1),
      age: parseInt(form.age), gender: form.gender,
      looking_for: form.looking_for, bio: form.bio,
      interests: form.interests, referral_code: genCode, coins: 10
    }, { onConflict: 'id' })

    // Credit referrer
    if (refCode) {
      const { data: referrer } = await sb.from('profiles').select('id,coins,full_name').eq('referral_code', refCode.toUpperCase()).maybeSingle()
      if (referrer && referrer.id !== user.id) {
        await sb.from('profiles').update({ coins: (referrer.coins || 0) + 50 }).eq('id', referrer.id)
        await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)
        try { await sb.from('referrals').insert([{ referrer_id: referrer.id, referred_id: user.id, amount: 50, status: 'credited' }]) } catch {}
      }
      localStorage.removeItem('ref_code')
    }

    setLoading(false)
    router.replace('/home?new=true')
  }

  const toggleInterest = (i: string) => setForm(f => ({
    ...f,
    interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : f.interests.length < 5 ? [...f.interests, i] : f.interests
  }))

  const progress = (step / 4) * 100

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e8e8e8', background: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>}
        <div style={{ flex: 1 }}>
          <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2 }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#f97316,#ec4899)', borderRadius: 2, width: `${progress}%`, transition: 'width 0.4s' }} />
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{step}/4</span>
      </div>

      <div style={{ flex: 1, padding: '24px 24px 32px', overflowY: 'auto' }}>

        {/* Step 1: Account */}
        {step === 1 && (
          <div className="fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Create Account 👋</h1>
            <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 14 }}>Join free and start connecting</p>
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Your Name" type="text" value={form.name} onChange={set('name')} placeholder="e.g. Emily Wanjiru" />
              <Input label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="you@gmail.com" />
              <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="6+ characters" />
              {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
              <Btn loading={loading}>Continue →</Btn>
            </form>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 20 }}>
              Already have an account?{' '}
              <span onClick={() => router.push('/login')} style={{ color: '#f97316', fontWeight: 700, cursor: 'pointer' }}>Sign In</span>
            </p>
          </div>
        )}

        {/* Step 2: Basics */}
        {step === 2 && (
          <div className="fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>About You</h1>
            <p style={{ color: '#94a3b8', marginBottom: 28, fontSize: 14 }}>Help us find your perfect match</p>
            <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input label="Your Age" type="number" value={form.age} onChange={set('age')} placeholder="e.g. 22" min="16" max="60" />
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>I am a</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['male','👨 Man'],['female','👩 Woman']].map(([val,label]) => (
                    <button key={val} type="button" onClick={() => set('gender')(val)}
                      style={{ padding: '14px', borderRadius: 14, border: `2px solid ${form.gender===val?'#f97316':'#e8e8e8'}`, background: form.gender===val?'#fff7ed':'#fff', color: form.gender===val?'#f97316':'#374151', fontSize: 15, fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 10 }}>Looking for</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['relationship','💕 Dating'],['friendship','🤝 Friends'],['casual','😊 Casual'],['networking','🌐 Network']].map(([val,label]) => (
                    <button key={val} type="button" onClick={() => set('looking_for')(val)}
                      style={{ padding: '12px', borderRadius: 14, border: `2px solid ${form.looking_for===val?'#ec4899':'#e8e8e8'}`, background: form.looking_for===val?'#fdf2f8':'#fff', color: form.looking_for===val?'#ec4899':'#374151', fontSize: 14, fontWeight: 700 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
              <Btn>Continue →</Btn>
            </form>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Add Photos 📸</h1>
            <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>Profiles with photos get 10x more matches. Add up to 6.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[...Array(6)].map((_, i) => {
                const photo = photos[i]
                return (
                  <div key={i} style={{ aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', border: `2px dashed ${photo?'transparent':'#e2e8f0'}`, background: photo?'transparent':'#f8fafc', position: 'relative', cursor: 'pointer' }}
                    onClick={() => !photo && fileRef.current?.click()}>
                    {photo
                      ? <>
                          <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                          <button onClick={e => { e.stopPropagation(); setPhotos(p => p.filter((_, j) => j !== i)) }}
                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                          {i === 0 && <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#f97316', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>MAIN</div>}
                        </>
                      : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                          {uploading && i === photos.length ? <div style={{ width: 20, height: 20, border: '2px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <span style={{ fontSize: 24, color: '#e2e8f0' }}>+</span>}
                        </div>
                    }
                  </div>
                )
              })}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = '' }} />
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <Btn onClick={() => { if(photos.length===0){setError('Add at least 1 photo');return} setStep(4) }} loading={uploading}>
              {photos.length === 0 ? 'Add a Photo First' : `Continue with ${photos.length} photo${photos.length>1?'s':''} →`}
            </Btn>
          </div>
        )}

        {/* Step 4: About + Interests */}
        {step === 4 && (
          <div className="fade-in">
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Final Touch ✨</h1>
            <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: 14 }}>Tell people what makes you unique</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>Bio <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
                <textarea value={form.bio} onChange={e => set('bio')(e.target.value)} placeholder="Say something about yourself..." rows={3}
                  style={{ width: '100%', border: '1.5px solid #e8e8e8', borderRadius: 14, padding: '12px 14px', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Interests <span style={{ color: '#94a3b8', fontWeight: 400 }}>({form.interests.length}/5)</span></label>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>Pick up to 5</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {INTERESTS.map(i => (
                    <button key={i} type="button" onClick={() => toggleInterest(i)}
                      style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${form.interests.includes(i)?'#f97316':'#e8e8e8'}`, background: form.interests.includes(i)?'#fff7ed':'#fff', color: form.interests.includes(i)?'#f97316':'#374151', fontSize: 13, fontWeight: 600 }}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
              <Btn onClick={handleFinish} loading={loading}>🎉 Start Matching!</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Input({ label, ...props }: any) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>
      <input {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', border: `1.5px solid ${focused?'#f97316':'#e8e8e8'}`, borderRadius: 14, padding: '13px 16px', fontSize: 15, outline: 'none', background: '#fff', transition: 'border 0.2s' }} />
    </div>
  )
}

function Btn({ children, loading, onClick, type = 'submit' }: any) {
  return (
    <button type={type} onClick={onClick} disabled={loading}
      style={{ width: '100%', padding: '16px', borderRadius: 28, border: 'none', background: loading?'#e2e8f0':'linear-gradient(135deg,#f97316,#ea580c)', color: loading?'#94a3b8':'#fff', fontSize: 16, fontWeight: 800, boxShadow: loading?'none':'0 4px 16px rgba(249,115,22,0.35)', transition: 'all 0.2s' }}>
      {loading ? <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #94a3b8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', verticalAlign: 'middle' }} /> : children}
    </button>
  )
}
