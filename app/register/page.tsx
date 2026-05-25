'use client'
import { useState } from 'react'
import Link from 'next/link'

const UNIVERSITIES = ['University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Maseno University','Egerton University','Dedan Kimathi University','Technical University of Kenya']

export default function RegisterPage() {
  const [form, setForm] = useState({name:'',email:'',password:'',university:'',course:'',year:'1',whatsapp:'',interests:''})
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))

  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
      <div style={{width:'100%',maxWidth:'520px',background:'white',borderRadius:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',padding:'40px',border:'1px solid #f3f4f6'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'900',fontSize:'18px',margin:'0 auto 14px',boxShadow:'0 8px 20px rgba(249,115,22,0.35)'}}>CL</div>
          <h1 style={{fontSize:'26px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Join CampusLink KE</h1>
          <p style={{color:'#9ca3af',fontSize:'14px'}}>Free forever. Connect with students across Kenya.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Full Name</label>
            <input value={form.name} onChange={set('name')} placeholder="John Kamau" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Email Address</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University</label>
            <select value={form.university} onChange={set('university')} style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
              <option value="">Select your university...</option>
              {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Course</label>
            <input value={form.course} onChange={set('course')} placeholder="e.g. Computer Science" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Year of Study</label>
            <select value={form.year} onChange={set('year')} style={inp}>
              {['1','2','3','4','5','6'].map(y=><option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp Number</label>
            <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+254712345678" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div style={{gridColumn:'1/-1'}}>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Interests <span style={{fontWeight:'400',color:'#9ca3af'}}>(comma separated)</span></label>
            <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music, reading" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
        </div>
        <button style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'14px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.35)',marginTop:'20px'}}>
          Create Free Account 🚀
        </button>
        <p style={{textAlign:'center',fontSize:'14px',color:'#9ca3af',marginTop:'16px'}}>
          Already have an account? <Link href="/login" style={{color:'#f97316',fontWeight:'700',textDecoration:'none'}}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
