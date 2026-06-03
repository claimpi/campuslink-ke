'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const ACCENT = '#c2185b'
const GREEN = '#25D366'

const INTERESTS = [
  'Date','Serious Dating','Casual Meets','Hookup','Travel Buddy','Movie Date',
  'Party & Night Out','Outdoor Activities','Indoor Meets','Gym Partner',
  'Virtual Meet/Video Date','Long Term Partner','Gaming Partner',
  'Dating leading to Marriage','Making New Friends','Local Connections',
  'Meet People Nearby','Long Distance Relationship','Trying Something New'
]

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1-10
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRefs = [useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)]

  // Form state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['','','','','',''])
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [orientation, setOrientation] = useState('Straight')
  const [showMe, setShowMe] = useState('Women')
  const [distance, setDistance] = useState(100)
  const [lookingFor, setLookingFor] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [photos, setPhotos] = useState<(string|null)[]>([null,null,null,null,null,null])

  const totalSteps = 10
  const pct = (step / totalSteps) * 100

  const back = () => { setErr(''); setStep(s => Math.max(1, s-1)) }
  const next = () => { setErr(''); setStep(s => s+1) }

  // STEP 1 - Phone
  async function sendOTP() {
    if (!phone || phone.length < 9) { setErr('Enter a valid phone number'); return }
    setBusy(true)
    // We use Supabase phone auth or just proceed with email-based for now
    // Store phone and move to OTP step
    sessionStorage.setItem('phone', '+254' + phone.replace(/^0/, ''))
    setBusy(false)
    next()
  }

  // STEP 2 - OTP verify
  const otpRefs = Array.from({length:6}, () => useRef<HTMLInputElement>(null))
  function onOtpChange(i:number, val:string) {
    const d = val.replace(/\D/g,'').slice(0,1)
    const n = [...otp]; n[i] = d; setOtp(n)
    if (d && i < 5) otpRefs[i+1].current?.focus()
    if (!d && i > 0) otpRefs[i-1].current?.focus()
  }
  async function verifyOTP() {
    const code = otp.join('')
    if (code.length < 6) { setErr('Enter the 6-digit code'); return }
    // For now accept any 6-digit code and create account with phone+random password
    setBusy(true)
    const ph = sessionStorage.getItem('phone') || ''
    const pw = Math.random().toString(36).slice(2) + 'Aa1!'
    const fakeEmail = `${ph.replace('+','').replace(/\s/g,'')}@campuslink.ke`
    const sb = createClient()
    // Try sign up
    const { error: signUpErr } = await sb.auth.signUp({ email: fakeEmail, password: pw, options: { data: { phone: ph } } })
    if (signUpErr && !signUpErr.message.includes('already registered')) {
      setErr(signUpErr.message); setBusy(false); return
    }
    // Try sign in if already exists
    if (signUpErr?.message.includes('already registered')) {
      const { error: signInErr } = await sb.auth.signInWithPassword({ email: fakeEmail, password: pw })
      if (signInErr) { setErr('Account exists. Please sign in.'); setBusy(false); return }
    }
    setBusy(false); next()
  }

  // STEP 10 - Upload photos
  async function uploadPhoto(idx:number, file:File) {
    setUploading(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setUploading(false); return }
    const path = `avatars/${user.id}/${Date.now()}_${idx}.${file.name.split('.').pop()}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { setErr('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(path)
    const newPhotos = [...photos]; newPhotos[idx] = publicUrl; setPhotos(newPhotos)
    setUploading(false)
  }

  // FINISH - Save profile
  async function finish() {
    const filled = photos.filter(Boolean)
    if (filled.length < 1) { setErr('Add at least 1 photo'); return }
    setBusy(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    const code = user.id.replace(/-/g,'').slice(0,8).toUpperCase()
    const ph = sessionStorage.getItem('phone') || ''
    // Calculate age from birth date
    let age = 0
    if (birthDate) {
      const [d,m,y] = birthDate.split('/')
      const dob = new Date(+y, +m-1, +d)
      age = Math.floor((Date.now() - dob.getTime()) / (365.25*24*60*60*1000))
    }
    await sb.from('profiles').upsert({
      id: user.id, email: user.email, phone: ph,
      nickname, full_name: nickname,
      avatar_url: filled[0],
      photos: filled.slice(1) as string[],
      birth_date: birthDate ? (() => { const [d,m,y]=birthDate.split('/'); return `${y}-${m}-${d}` })() : null,
      age, gender, orientation,
      show_me: showMe, looking_for: lookingFor,
      interests: selectedInterests,
      distance_pref: distance,
      referral_code: code, coins: 20,
    }, { onConflict: 'id' })
    // Handle referral
    const ref = localStorage.getItem('ref_code')
    if (ref) {
      const { data: referrer } = await sb.from('profiles').select('id,coins').eq('referral_code', ref.toUpperCase()).maybeSingle()
      if (referrer && referrer.id !== user.id) {
        await sb.from('profiles').update({ coins: (referrer.coins||0)+50 }).eq('id', referrer.id)
        await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', user.id)
        try { await sb.from('referrals').insert([{ referrer_id:referrer.id, referred_id:user.id, amount:50, status:'credited' }]) } catch {}
        localStorage.removeItem('ref_code')
      }
    }
    setBusy(false)
    router.replace('/home?new=true')
  }

  const togInterest = (i:string) => setSelectedInterests(x => x.includes(i) ? x.filter(v=>v!==i) : x.length<3 ? [...x,i] : x)

  return (
    <div style={{minHeight:'100dvh',background:'#f8f8f8',display:'flex',flexDirection:'column'}}>

      {/* Header with back + progress */}
      {step > 1 && (
        <div style={{padding:'12px 16px 0',display:'flex',alignItems:'center',gap:12,background:'#fff'}}>
          <button onClick={back} style={{fontSize:22,color:'#333',lineHeight:1,padding:'4px'}}>←</button>
          <div style={{flex:1,height:3,background:'#f0f0f0',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',background:ACCENT,borderRadius:2,width:`${pct}%`,transition:'width 0.3s'}}/>
          </div>
        </div>
      )}

      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#fff',overflow:'hidden'}}>

        {/* STEP 1 — Phone */}
        {step===1 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:26,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:10,lineHeight:1.25}}>Please Enter your Phone Number</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:36,lineHeight:1.5}}>We'll need your phone number to send an OTP for verification.</p>
              <div style={{display:'flex',border:'1.5px solid #e0e0e0',borderRadius:12,overflow:'hidden',background:'#fff',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',padding:'0 12px',gap:6,borderRight:'1px solid #e0e0e0',background:'#fafafa',flexShrink:0}}>
                  <span style={{fontSize:18}}>🇰🇪</span>
                  <span style={{fontSize:14,fontWeight:600,color:'#333'}}>+254</span>
                  <span style={{color:'#999',fontSize:12}}>▾</span>
                </div>
                <input type="tel" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))}
                  placeholder="Enter phone number" maxLength={10}
                  style={{flex:1,border:'none',padding:'14px 16px',fontSize:15,outline:'none',background:'transparent'}}/>
              </div>
              {err && <p style={{color:'#ef4444',fontSize:13,textAlign:'center',marginBottom:8}}>{err}</p>}
              <p style={{color:'#888',fontSize:13,textAlign:'center',marginTop:8}}>You will receive an OTP on your WhatsApp Number</p>
            </div>
            <div>
              <p style={{color:'#999',fontSize:12,textAlign:'center',marginBottom:12}}>By entering your phone number, you accept our <span style={{color:ACCENT,fontWeight:600}}>Terms & Conditions</span></p>
              <button onClick={sendOTP} disabled={busy}
                style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:GREEN,color:'#fff',fontSize:16,fontWeight:700,boxShadow:'0 4px 16px rgba(37,211,102,0.4)'}}>
                {busy?'Sending...':'Send OTP on WhatsApp'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — OTP */}
        {step===2 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:26,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:10}}>Verification Code</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:6}}>Please enter code we just send to</p>
              <p style={{color:'#1a1a2e',fontSize:15,fontWeight:700,textAlign:'center',marginBottom:36}}>
                {sessionStorage.getItem('phone')||'+254...'} <span style={{color:ACCENT,cursor:'pointer'}} onClick={back}>✎</span>
              </p>
              <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:24}}>
                {otp.map((d,i)=>(
                  <input key={i} ref={otpRefs[i]} type="tel" maxLength={1} value={d}
                    onChange={e=>onOtpChange(i,e.target.value)}
                    style={{width:46,height:56,borderRadius:12,border:`1.5px solid ${d?ACCENT:'#e0e0e0'}`,textAlign:'center',fontSize:22,fontWeight:700,outline:'none',background:'#fff',color:'#333'}}/>
                ))}
              </div>
              {err && <p style={{color:'#ef4444',fontSize:13,textAlign:'center'}}>{err}</p>}
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:4}}>Didn't receive OTP?</p>
              <p style={{color:ACCENT,fontSize:14,fontWeight:700,textAlign:'center',cursor:'pointer',textDecoration:'underline'}} onClick={()=>setStep(1)}>Resend Code</p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <button onClick={()=>verifyOTP()} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:GREEN,color:'#fff',fontSize:16,fontWeight:700}}>
                {busy?'Verifying...':'Check OTP on WhatsApp'}
              </button>
              <button onClick={verifyOTP} disabled={busy} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>
                {busy?'...':'Verify'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Nickname + Email */}
        {step===3 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>Enter your Nick Name and Email id</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:36}}>Let's Get to Know You</p>
              <div style={{border:'1.5px solid #e0e0e0',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:10,marginBottom:6,background:'#fff'}}>
                <span style={{fontSize:18,color:'#bbb'}}>👤</span>
                <input value={nickname} onChange={e=>setNickname(e.target.value.slice(0,25))} placeholder="Enter Your Nick Name"
                  style={{flex:1,border:'none',outline:'none',fontSize:15,background:'transparent',color:'#333'}}/>
              </div>
              <p style={{textAlign:'right',fontSize:12,color:nickname.length>20?ACCENT:'#bbb',marginBottom:16}}>{nickname.length}/25</p>
              <div style={{border:'1.5px solid #e0e0e0',borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:10,background:'#fff'}}>
                <span style={{fontSize:18,color:'#bbb'}}>✉️</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter Email Address"
                  style={{flex:1,border:'none',outline:'none',fontSize:15,background:'transparent',color:'#333'}}/>
              </div>
              {err && <p style={{color:'#ef4444',fontSize:13,marginTop:12}}>{err}</p>}
            </div>
            <button onClick={()=>{if(!nickname.trim()){setErr('Enter your nickname');return}next()}}
              style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>
              Continue
            </button>
          </div>
        )}

        {/* STEP 4 — Birth Date */}
        {step===4 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>What is your Birth Date?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:36}}>Please provide your Birthdate</p>
              <input type="text" value={birthDate} onChange={e=>{
                let v=e.target.value.replace(/[^\d/]/g,'')
                if(v.length===2&&!v.includes('/'))v=v+'/'
                if(v.length===5&&v.split('/').length===2)v=v+'/'
                setBirthDate(v.slice(0,10))
              }} placeholder="DD / MM / YYYY" maxLength={10}
                style={{width:'100%',border:'1.5px solid #e0e0e0',borderRadius:12,padding:'16px',fontSize:18,textAlign:'center',outline:'none',background:'#fff',color:'#333',letterSpacing:2}}
                onFocus={e=>e.target.style.borderColor=ACCENT} onBlur={e=>e.target.style.borderColor='#e0e0e0'}/>
              {err && <p style={{color:'#ef4444',fontSize:13,marginTop:12,textAlign:'center'}}>{err}</p>}
            </div>
            <button onClick={()=>{
              const parts=birthDate.split('/')
              if(parts.length!==3||parts[2].length!==4){setErr('Enter valid date DD/MM/YYYY');return}
              const age=Math.floor((Date.now()-new Date(+parts[2],+parts[1]-1,+parts[0]).getTime())/(365.25*24*60*60*1000))
              if(age<16){setErr('You must be at least 16 years old');return}
              next()
            }} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>
              Continue
            </button>
          </div>
        )}

        {/* STEP 5 — Gender */}
        {step===5 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>What's Your Gender?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:48}}>Tell us about your gender</p>
              <div style={{display:'flex',flexDirection:'column',gap:28,alignItems:'center'}}>
                {[['male','♂','Male'],['female','♀','Female']].map(([v,sym,label])=>(
                  <div key={v} onClick={()=>setGender(v)}
                    style={{width:140,height:140,borderRadius:'50%',background:gender===v?`${ACCENT}18`:'#f5f5f5',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',border:`2px solid ${gender===v?ACCENT:'transparent'}`,transition:'all 0.2s'}}>
                    <span style={{fontSize:40,color:gender===v?ACCENT:'#8888aa',marginBottom:6}}>{sym}</span>
                    <span style={{fontSize:16,fontWeight:600,color:gender===v?ACCENT:'#666'}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>{if(!gender){setErr('Select your gender');return}next()}}
              style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:gender?ACCENT:'#e0e0e0',color:gender?'#fff':'#aaa',fontSize:16,fontWeight:700}}>
              Continue
            </button>
          </div>
        )}

        {/* STEP 6 — Orientation */}
        {step===6 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>What's Your Sexual Orientation?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:36}}>Help us match you with the right people</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {['Straight','Gay','Lesbian','Bisexual'].map(o=>(
                  <div key={o} onClick={()=>setOrientation(o)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderRadius:14,border:`1.5px solid ${orientation===o?ACCENT:'#e0e0e0'}`,background:'#fff',cursor:'pointer',transition:'all 0.2s'}}>
                    <span style={{fontSize:16,fontWeight:orientation===o?700:400,color:orientation===o?'#1a1a2e':'#555'}}>{o}</span>
                    <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${orientation===o?ACCENT:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {orientation===o&&<div style={{width:12,height:12,borderRadius:'50%',background:ACCENT}}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={next} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>Continue</button>
          </div>
        )}

        {/* STEP 7 — Show Me */}
        {step===7 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>Who would you like to see?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:36}}>Help us match you with the right people</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {['Men','Women','Both'].map(o=>(
                  <div key={o} onClick={()=>setShowMe(o)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderRadius:14,border:`1.5px solid ${showMe===o?ACCENT:'#e0e0e0'}`,background:'#fff',cursor:'pointer',transition:'all 0.2s'}}>
                    <span style={{fontSize:16,fontWeight:showMe===o?700:400,color:showMe===o?'#1a1a2e':'#555'}}>{o}</span>
                    <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${showMe===o?ACCENT:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {showMe===o&&<div style={{width:12,height:12,borderRadius:'50%',background:ACCENT}}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={next} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>Continue</button>
          </div>
        )}

        {/* STEP 8 — Location */}
        {step===8 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div style={{textAlign:'center'}}>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',marginBottom:12}}>So, are you from around here?</h1>
              <p style={{color:'#888',fontSize:14,lineHeight:1.6,marginBottom:48,maxWidth:300,margin:'0 auto 48px'}}>Set your location to discover people nearby or explore matches beyond your neighbourhood. Without location access, you won't be able to match with others.</p>
              <div style={{width:80,height:80,borderRadius:'50%',background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 48px',fontSize:36,color:'#bbb'}}>📍</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <button onClick={()=>{
                navigator.geolocation?.getCurrentPosition(async p=>{
                  try {
                    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`)
                    const g=await r.json()
                    const town=g.address?.suburb||g.address?.city||g.address?.town||'Kenya'
                    sessionStorage.setItem('lat',String(p.coords.latitude))
                    sessionStorage.setItem('lng',String(p.coords.longitude))
                    sessionStorage.setItem('location',town)
                  } catch {}
                  next()
                },()=>next())
              }} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>
                Allow Location Access
              </button>
              <p style={{color:'#1a1a2e',fontSize:13,fontWeight:600,textAlign:'center',cursor:'pointer'}} onClick={next}>How is my location used? ▾</p>
            </div>
          </div>
        )}

        {/* STEP 9 — Distance */}
        {step===9 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>Your distance preference?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:48}}>Choose how far you're willing to meet someone.</p>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <span style={{fontWeight:700,color:'#1a1a2e',fontSize:15}}>Distance preference</span>
                <span style={{fontWeight:700,color:'#1a1a2e',fontSize:15}}>{distance} Km</span>
              </div>
              <input type="range" min={50} max={500} step={10} value={distance} onChange={e=>setDistance(+e.target.value)}
                style={{width:'100%',accentColor:ACCENT,height:4,marginBottom:12}}/>
              <p style={{color:'#888',fontSize:13,textAlign:'center'}}>You Can select within 50km to 500km</p>
            </div>
            <button onClick={next} style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>Continue</button>
          </div>
        )}

        {/* STEP 10 — Looking for */}
        {step===10 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'48px 24px 32px',justifyContent:'space-between'}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>What are you Looking for?</h1>
              <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:24}}>Provide us with further insights into your preferences</p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {['Long-Term Relationship','Short-Term Relationship','Casual Connection','Just exploring','Open for All'].map(o=>(
                  <div key={o} onClick={()=>setLookingFor(o)}
                    style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderRadius:14,border:`1.5px solid ${lookingFor===o?ACCENT:'#e0e0e0'}`,background:'#fff',cursor:'pointer',transition:'all 0.2s'}}>
                    <span style={{fontSize:15,fontWeight:lookingFor===o?700:400,color:lookingFor===o?'#1a1a2e':'#555'}}>{o}</span>
                    <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${lookingFor===o?ACCENT:'#ccc'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {lookingFor===o&&<div style={{width:12,height:12,borderRadius:'50%',background:ACCENT}}/>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={()=>{if(!lookingFor){setErr('Select what you are looking for');return}setStep(11)}}
              style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700}}>Continue</button>
          </div>
        )}

        {/* STEP 11 — Interests */}
        {step===11 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'24px 20px 32px',overflowY:'auto'}}>
            <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>Select Any 3 Interests</h1>
            <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:24,lineHeight:1.5}}>Tell us what piques your curiosity and passions</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:32}}>
              {INTERESTS.map(i=>{
                const sel=selectedInterests.includes(i)
                return(
                  <button key={i} onClick={()=>togInterest(i)}
                    style={{padding:'10px 16px',borderRadius:50,border:`1.5px solid ${sel?ACCENT:'#e0e0e0'}`,background:sel?`${ACCENT}14`:'#fff',color:sel?ACCENT:'#555',fontSize:13,fontWeight:sel?700:400,transition:'all 0.2s'}}>
                    {i}
                  </button>
                )
              })}
            </div>
            <button onClick={()=>{if(selectedInterests.length<1){setErr('Select at least 1 interest');return}setStep(12)}}
              style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:ACCENT,color:'#fff',fontSize:16,fontWeight:700,marginTop:'auto'}}>
              Continue ({selectedInterests.length}/3)
            </button>
          </div>
        )}

        {/* STEP 12 — Photos */}
        {step===12 && (
          <div style={{flex:1,display:'flex',flexDirection:'column',padding:'24px 20px 32px',overflowY:'auto'}}>
            <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',textAlign:'center',marginBottom:6}}>Upload your photo</h1>
            <p style={{color:'#888',fontSize:14,textAlign:'center',marginBottom:24,lineHeight:1.5}}>We'd love to see you. Upload a photo for your dating journey.</p>
            
            {/* Photo grid — 1 large + 2 medium + 3 small */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'auto auto',gap:8,marginBottom:16}}>
              {/* Main large photo */}
              <div style={{gridRow:'1/3',aspectRatio:'2/3',borderRadius:16,border:`2px dashed ${ACCENT}`,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'#fafafa',position:'relative'}}
                onClick={()=>fileRefs[0].current?.click()}>
                {photos[0]
                  ?<><img src={photos[0]} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/><button onClick={e=>{e.stopPropagation();const n=[...photos];n[0]=null;setPhotos(n)}} style={{position:'absolute',top:6,right:6,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></>
                  :<div style={{width:44,height:44,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:24,fontWeight:700}}>+</div>
                }
              </div>
              {/* 2 medium right */}
              {[1,2].map(i=>(
                <div key={i} style={{aspectRatio:'1',borderRadius:14,border:`2px dashed ${ACCENT}`,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'#fafafa',position:'relative'}}
                  onClick={()=>fileRefs[i].current?.click()}>
                  {photos[i]
                    ?<><img src={photos[i]!} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/><button onClick={e=>{e.stopPropagation();const n=[...photos];n[i]=null;setPhotos(n)}} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></>
                    :<div style={{width:36,height:36,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:20,fontWeight:700}}>+</div>
                  }
                </div>
              ))}
            </div>
            {/* 3 bottom small */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:16}}>
              {[3,4,5].map(i=>(
                <div key={i} style={{aspectRatio:'1',borderRadius:14,border:`2px dashed ${ACCENT}`,overflow:'hidden',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:'#fafafa',position:'relative'}}
                  onClick={()=>fileRefs[i].current?.click()}>
                  {photos[i]
                    ?<><img src={photos[i]!} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/><button onClick={e=>{e.stopPropagation();const n=[...photos];n[i]=null;setPhotos(n)}} style={{position:'absolute',top:4,right:4,width:20,height:20,borderRadius:'50%',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button></>
                    :<div style={{width:32,height:32,borderRadius:'50%',background:ACCENT,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>+</div>
                  }
                </div>
              ))}
            </div>

            {/* Hidden file inputs */}
            {fileRefs.map((ref,i)=>(
              <input key={i} ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadPhoto(i,f);e.target.value=''}}/>
            ))}

            {/* Do's */}
            <div style={{background:'#f0faf5',border:'1px solid #c8e6c9',borderRadius:12,padding:'12px 16px',marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
                <span style={{background:'#4caf50',color:'#fff',borderRadius:'50%',width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>✓</span>
                <span style={{fontWeight:700,color:'#2e7d32',fontSize:14}}>Do's</span>
              </div>
              <div style={{width:'100%',height:1,background:'#c8e6c9',marginBottom:8}}/>
              <p style={{color:'#2e7d32',fontSize:13,margin:'3px 0'}}>✓ Clearly shows your face.</p>
              <p style={{color:'#2e7d32',fontSize:13,margin:'3px 0'}}>✓ Good quality, bright and clear.</p>
            </div>

            {err && <p style={{color:'#ef4444',fontSize:13,textAlign:'center',marginBottom:12}}>{err}</p>}
            <button onClick={finish} disabled={busy||uploading}
              style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:busy?'#e0e0e0':ACCENT,color:busy?'#aaa':'#fff',fontSize:16,fontWeight:700}}>
              {busy?'Setting up...':uploading?'Uploading...':'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
