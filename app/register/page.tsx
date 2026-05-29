'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const UNIS=['Africa Nazarene University','Dedan Kimathi University','Egerton University','JKUAT','Kenyatta University','Kisii University','Laikipia University','Maseno University','Meru University','Moi University','Mount Kenya University','Multimedia University','Pwani University','Rongo University','Strathmore University','Technical University of Kenya','University of Nairobi','University of Eldoret','University of Embu','Zetech University','Other']
const COURSES=['Accounting','Architecture','Business Administration','Civil Engineering','Computer Science','Electrical Engineering','Education','Finance','Journalism','Law','Marketing','Mathematics','Medicine','Nursing','Pharmacy','Psychology','Software Engineering']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [photoFile, setPhotoFile] = useState<File|null>(null)
  const [photoPreview, setPhotoPreview] = useState<string|null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [form, setForm] = useState({name:'',email:'',password:'',confirmPassword:'',university:'',course:'',year:'1',whatsapp:'',interests:'',bio:''})
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))
  const inp:React.CSSProperties = {width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',boxSizing:'border-box',color:'#0f172a'}

  useEffect(() => {
    const stored = localStorage.getItem('ref_code')
    if (stored) setRefCode(stored)
  }, [])

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Photo must be less than 5MB'); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep(2)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if(step === 2) { setError(''); setStep(3); return }
    setLoading(true); setError('')
    const sb = createClient()
    try {
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.name }, emailRedirectTo: 'https://campuslink-ke.vercel.app/auth/callback' }
      })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (!authData.user) { setError('Registration failed.'); setLoading(false); return }

      const interests = form.interests.split(',').map(i=>i.trim()).filter(Boolean)
      // Generate unique referral code for new user
      const newRefCode = authData.user.id.replace(/-/g,'').substring(0,8).toUpperCase()

      await sb.from('profiles').upsert({
        id: authData.user.id,
        email: form.email.trim(),
        full_name: form.name,
        university: form.university,
        course: form.course,
        year_of_study: form.year,
        whatsapp_number: form.whatsapp,
        bio: form.bio,
        interests,
        referral_code: newRefCode,
        referral_earnings: 0,
      }, { onConflict: 'id' })

      // Credit referrer KES 10 via server API (bypasses RLS)
      if (refCode) {
        fetch('/api/referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referralCode: refCode, newUserId: authData.user.id })
        }).catch(() => {}) // Silent fail - don't block registration
      }

      localStorage.removeItem('ref_code')
      router.push('/dashboard?welcome=true')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{width:'100%',maxWidth:'500px',background:'#fff',borderRadius:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:'36px',border:'1px solid #e2e8f0'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'16px',margin:'0 auto 12px'}}>CL</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Create Account</h1>
          <p style={{color:'#94a3b8',fontSize:'13px'}}>Join CampusLink KE — free forever</p>
          {refCode&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'7px 12px',marginTop:'10px',fontSize:'12px',color:'#16a34a',fontWeight:'600'}}>Referral code applied: {refCode}</div>}
        </div>

        <div style={{display:'flex',gap:'6px',marginBottom:'20px'}}>
          {[1,2,3].map(n=><div key={n} style={{flex:1,height:'3px',borderRadius:'2px',background:step>=n?'linear-gradient(135deg,#f97316,#ea580c)':'#f1f5f9',transition:'all 0.3s'}}/>)}
        </div>

        {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}

        {step===1&&(
          <form onSubmit={nextStep} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Full Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="John Kamau" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Email *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Password *</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <button type="submit" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:'pointer',marginTop:'4px'}}>Continue →</button>
          </form>
        )}

        {step===2&&(
          <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:'13px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University *</label>
                <select value={form.university} onChange={set('university')} required style={inp}>
                  <option value="">Select your university...</option>
                  {UNIS.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Course</label>
                <select value={form.course} onChange={set('course')} style={inp}>
                  <option value="">Select...</option>
                  {COURSES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Year</label>
                <select value={form.year} onChange={set('year')} style={inp}>
                  {['1','2','3','4','5','6'].map(y=><option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp</label>
                <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+254712345678" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Interests <span style={{fontWeight:'400',color:'#94a3b8'}}>(comma separated)</span></label>
                <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Bio <span style={{fontWeight:'400',color:'#94a3b8'}}>(optional)</span></label>
                <textarea value={form.bio} onChange={set('bio')} rows={2} placeholder="Tell others about yourself..." style={{...inp,resize:'none'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button type="button" onClick={()=>{setStep(1);setError('')}} style={{flex:1,border:'1.5px solid #e2e8f0',background:'#fff',color:'#64748b',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',cursor:'pointer'}}>← Back</button>
              <button type="submit" style={{flex:2,background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>
                Continue to Photo
              </button>
            </div>
          </form>
        )}

        {step===3&&(
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'14px',color:'#374151',fontWeight:'600',marginBottom:'4px'}}>Add your profile photo</p>
              <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'16px'}}>Required — help others recognize you</p>
              {photoPreview
                ?<div style={{position:'relative',display:'inline-block'}}>
                  <img src={photoPreview} style={{width:'120px',height:'120px',borderRadius:'50%',objectFit:'cover',border:'3px solid #f97316'}}/>
                  <button onClick={()=>{setPhotoFile(null);setPhotoPreview(null)}} style={{position:'absolute',top:0,right:0,background:'#ef4444',color:'#fff',border:'none',borderRadius:'50%',width:'24px',height:'24px',cursor:'pointer',fontSize:'12px'}}>x</button>
                </div>
                :<label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:'120px',height:'120px',borderRadius:'50%',border:'2px dashed #f97316',cursor:'pointer',background:'#fff7ed',margin:'0 auto'}}>
                  <span style={{fontSize:'32px'}}>+</span>
                  <span style={{fontSize:'11px',color:'#f97316',fontWeight:'600'}}>Add Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{display:'none'}}/>
                </label>
              }
            </div>
            {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}
            <button onClick={async()=>{
              if(!photoFile){setError('Please add a profile photo to continue');return}
              setUploadingPhoto(true);setError('')
              try{
                const sb=createClient()
                const {data:{user}}=await sb.auth.getUser()
                if(!user){setError('Session expired');setUploadingPhoto(false);return}
                const ext=photoFile.name.split('.').pop()
                const path=`${user.id}/avatar.${ext}`
                const {error:upErr}=await sb.storage.from('avatars').upload(path,photoFile,{upsert:true})
                if(upErr){setError('Upload failed: '+upErr.message);setUploadingPhoto(false);return}
                const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path)
                await sb.from('profiles').update({avatar_url:publicUrl}).eq('id',user.id)
                window.location.href='/dashboard?welcome=true'
              }catch(e:any){setError(e.message);setUploadingPhoto(false)}
            }} disabled={uploadingPhoto||!photoFile}
              style={{background:(!photoFile||uploadingPhoto)?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:(!photoFile||uploadingPhoto)?'not-allowed':'pointer'}}>
              {uploadingPhoto?'Uploading...':'Complete Sign Up'}
            </button>
            <p style={{textAlign:'center',fontSize:'12px',color:'#94a3b8'}}>Your photo helps others connect with you</p>
          </div>
        )}

        <p style={{textAlign:'center',fontSize:'13px',color:'#94a3b8',marginTop:'18px'}}>
          Already have an account? <Link href="/login" style={{color:'#f97316',fontWeight:'700'}}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
