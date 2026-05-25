'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const UNIVERSITIES = ['Africa Nazarene University','Dedan Kimathi University','Egerton University','JKUAT','Kenyatta University','Maseno University','Moi University','Strathmore University','Technical University of Kenya','University of Nairobi','University of Eldoret','Multimedia University']
const COURSES = ['Accounting','Architecture','Business Administration','Civil Engineering','Computer Science','Electrical Engineering','Education','Finance','Journalism','Law','Marketing','Mathematics','Medicine','Nursing','Pharmacy','Psychology','Software Engineering']

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name:'', email:'', password:'', confirmPassword:'',
    university:'', course:'', year:'1', whatsapp:'', interests:'', bio:''
  })
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))
  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep(2)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    try {
      // Step 1: Sign up auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { full_name: form.name },
          emailRedirectTo: 'https://campuslink-ke.vercel.app/auth/callback'
        }
      })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (!authData.user) { setError('Registration failed. Try again.'); setLoading(false); return }

      // Step 2: Create profile using upsert (handles both insert and update)
      const interests = form.interests.split(',').map(i=>i.trim()).filter(Boolean)
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: form.email.trim(),
        full_name: form.name,
        university: form.university,
        course: form.course,
        year_of_study: form.year,
        whatsapp_number: form.whatsapp,
        bio: form.bio,
        interests,
        is_premium: false,
        is_featured: false,
        is_top_student: false,
      }, { onConflict: 'id' })

      if (profileError) {
        console.error('Profile error:', profileError.message)
        // Don't block - user is created, profile can be filled later
      }

      router.push('/dashboard?welcome=true')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
      <div style={{width:'100%',maxWidth:'500px',background:'white',borderRadius:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',padding:'40px',border:'1px solid #f3f4f6'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'900',fontSize:'18px',margin:'0 auto 12px',boxShadow:'0 8px 20px rgba(249,115,22,0.35)'}}>CL</div>
          <h1 style={{fontSize:'24px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Join CampusLink KE</h1>
          <p style={{color:'#9ca3af',fontSize:'13px'}}>Free forever · Connect with students across Kenya</p>
        </div>

        {/* Progress */}
        <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
          {[1,2].map(n=><div key={n} style={{flex:1,height:'4px',borderRadius:'2px',background:step>=n?'linear-gradient(135deg,#f97316,#ea580c)':'#f3f4f6',transition:'all 0.3s'}}/>)}
        </div>
        <p style={{fontSize:'12px',color:'#9ca3af',textAlign:'center',marginBottom:'20px'}}>Step {step} of 2 — {step===1?'Account Details':'Your Profile'}</p>

        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'11px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>⚠️ {error}</div>}

        {step === 1 && (
          <form onSubmit={nextStep} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Full Name *</label>
              <input value={form.name} onChange={set('name')} placeholder="John Kamau" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Email *</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Password *</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
            </div>
            <button type="submit" style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.3)',marginTop:'4px'}}>Continue →</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:'13px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University *</label>
                <select value={form.university} onChange={set('university')} required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
                  <option value="">Select your university...</option>
                  {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
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
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp Number</label>
                <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+254712345678" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Interests <span style={{fontWeight:'400',color:'#9ca3af'}}>(comma separated)</span></label>
                <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Bio <span style={{fontWeight:'400',color:'#9ca3af'}}>(optional)</span></label>
                <textarea value={form.bio} onChange={set('bio')} placeholder="Tell others about yourself..." rows={2} style={{...inp,resize:'none' as const}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
              <button type="button" onClick={()=>{setStep(1);setError('')}} style={{flex:1,border:'1.5px solid #e5e7eb',background:'white',color:'#6b7280',padding:'12px',borderRadius:'12px',fontWeight:'600',fontSize:'14px',cursor:'pointer'}}>← Back</button>
              <button type="submit" disabled={loading} style={{flex:2,background:loading?'#fdba74':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'12px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.3)'}}>
                {loading?'⏳ Creating account...':'🚀 Create Account'}
              </button>
            </div>
          </form>
        )}

        <p style={{textAlign:'center',fontSize:'14px',color:'#9ca3af',marginTop:'18px'}}>
          Already have an account? <Link href="/login" style={{color:'#f97316',fontWeight:'700',textDecoration:'none'}}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
