'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function send(e:any) {
    e.preventDefault(); setLoading(true)
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setLoading(false); setSent(true)
  }

  return (
    <div style={{minHeight:'100dvh',background:'#fff',display:'flex',flexDirection:'column',padding:'48px 24px'}}>
      <button onClick={()=>router.back()} style={{width:36,height:36,borderRadius:'50%',border:'1px solid #e8e8e8',background:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}>←</button>
      <h1 style={{fontSize:26,fontWeight:900,color:'#111',marginBottom:6}}>Reset Password</h1>
      <p style={{color:'#94a3b8',fontSize:14,marginBottom:28}}>Enter your email and we'll send a reset link</p>
      {sent
        ?<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:14,padding:'16px',textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:8}}>📧</div>
          <p style={{color:'#16a34a',fontWeight:700}}>Check your email!</p>
          <p style={{color:'#94a3b8',fontSize:13,marginTop:4}}>We sent a reset link to {email}</p>
        </div>
        :<form onSubmit={send} style={{display:'flex',flexDirection:'column',gap:14}}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" required
            style={{width:'100%',border:'1.5px solid #e8e8e8',borderRadius:14,padding:'13px 16px',fontSize:15,outline:'none'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:16,fontWeight:900}}>
            {loading?'Sending...':'Send Reset Link'}
          </button>
        </form>
      }
    </div>
  )
}
