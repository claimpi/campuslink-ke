'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const UNIVERSITIES = ['Africa Nazarene University','Dedan Kimathi University','Egerton University','JKUAT','Kenyatta University','Maseno University','Moi University','Strathmore University','Technical University of Kenya','University of Nairobi','University of Eldoret','Multimedia University']
const COURSES = ['Accounting','Architecture','Business Administration','Civil Engineering','Computer Science','Electrical Engineering','Education','Finance','Journalism','Law','Marketing','Mathematics','Medicine','Nursing','Pharmacy','Psychology','Software Engineering']

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name:'', university:'', course:'', year_of_study:'1',
    whatsapp_number:'', bio:'', interests:''
  })

  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          university: profile.university || '',
          course: profile.course || '',
          year_of_study: String(profile.year_of_study || '1'),
          whatsapp_number: profile.whatsapp_number || '',
          bio: profile.bio || '',
          interests: (profile.interests || []).join(', '),
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const interests = form.interests.split(',').map(i=>i.trim()).filter(Boolean)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      university: form.university,
      course: form.course,
      year_of_study: parseInt(form.year_of_study),
      whatsapp_number: form.whatsapp_number,
      bio: form.bio,
      interests,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)
    if (error) { setError(error.message) } else { setSuccess(true); setTimeout(()=>setSuccess(false),3000) }
    setSaving(false)
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#9ca3af',fontSize:'16px'}}>Loading profile...</div>

  return (
    <div style={{maxWidth:'640px',margin:'0 auto',padding:'32px 16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
        <button onClick={()=>router.push('/dashboard')} style={{background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'8px 14px',fontSize:'13px',color:'#6b7280',cursor:'pointer',fontWeight:'600'}}>← Back</button>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>Edit Profile</h1>
          <p style={{color:'#9ca3af',fontSize:'13px'}}>Keep your profile up to date</p>
        </div>
      </div>

      {success && <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'12px 16px',marginBottom:'20px',color:'#16a34a',fontSize:'14px',fontWeight:'600'}}>✅ Profile saved successfully!</div>}
      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'12px',padding:'12px 16px',marginBottom:'20px',color:'#dc2626',fontSize:'14px'}}>⚠️ {error}</div>}

      <form onSubmit={handleSave} style={{background:'white',borderRadius:'20px',border:'1px solid #f3f4f6',padding:'28px',boxShadow:'0 4px 20px rgba(0,0,0,0.06)',display:'flex',flexDirection:'column',gap:'18px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Full Name *</label>
          <input value={form.full_name} onChange={set('full_name')} placeholder="Your full name" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>University</label>
            <select value={form.university} onChange={set('university')} style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">Select...</option>
              {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Course</label>
            <select value={form.course} onChange={set('course')} style={inp}>
              <option value="">Select...</option>
              {COURSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Year of Study</label>
            <select value={form.year_of_study} onChange={set('year_of_study')} style={inp}>
              {['1','2','3','4','5','6'].map(y=><option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>WhatsApp Number</label>
            <input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="+254712345678" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Bio</label>
          <textarea value={form.bio} onChange={set('bio')} placeholder="Tell other students about yourself..." rows={4} style={{...inp,resize:'none' as const}} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Interests <span style={{fontWeight:'400',color:'#9ca3af'}}>(comma separated)</span></label>
          <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music, reading" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
        </div>
        <button type="submit" disabled={saving} style={{background:saving?'#fdba74':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'14px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:saving?'not-allowed':'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.3)',marginTop:'4px'}}>
          {saving ? '⏳ Saving...' : '💾 Save Profile'}
        </button>
      </form>
    </div>
  )
}
