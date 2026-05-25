'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
      <div style={{width:'100%',maxWidth:'420px',background:'white',borderRadius:'24px',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',padding:'40px',border:'1px solid #f3f4f6'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'900',fontSize:'18px',margin:'0 auto 14px',boxShadow:'0 8px 20px rgba(249,115,22,0.35)'}}>CL</div>
          <h1 style={{fontSize:'26px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Welcome Back</h1>
          <p style={{color:'#9ca3af',fontSize:'14px'}}>Sign in to CampusLink KE</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box',transition:'border-color 0.2s'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'6px'}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              style={{width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>
          <button style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:'pointer',boxShadow:'0 6px 16px rgba(249,115,22,0.35)',marginTop:'4px'}}>
            Sign In
          </button>
        </div>
        <p style={{textAlign:'center',fontSize:'14px',color:'#9ca3af',marginTop:'24px'}}>
          Don't have an account? <Link href="/register" style={{color:'#f97316',fontWeight:'700',textDecoration:'none'}}>Join Free</Link>
        </p>
      </div>
    </div>
  )
}
