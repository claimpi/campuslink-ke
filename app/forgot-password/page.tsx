'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  async function send(e:any) {
    e.preventDefault(); setBusy(true)
    await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    setBusy(false); setSent(true)
  }
  return (
    <div style={{minHeight:'100dvh',background:'#fff',padding:'48px 24px',display:'flex',flexDirection:'column'}}>
      <button onClick={()=>router.back()} style={{width:36,height:36,borderRadius:'50%',border:'1px solid #e0e0e0',background:'#fff',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:32}}>←</button>
      <h1 style={{fontSize:24,fontWeight:900,color:'#1a1a2e',marginBottom:6}}>Reset Password</h1>
      <p style={{color:'#888',fontSize:14,marginBottom:28}}>Enter your email to receive a reset link</p>
      {sent ? <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:14,padding:20,textAlign:'center'}}><div style={{fontSize:32,marginBottom:8}}>📧</div><p style={{color:'#16a34a',fontWeight:700}}>Check your email!</p></div>
      : <form onSubmit={send} style={{display:'flex',flexDirection:'column',gap:14}}>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" required style={{border:'1.5px solid #e0e0e0',borderRadius:14,padding:'14px 16px',fontSize:15,outline:'none'}} onFocus={e=>e.target.style.borderColor='#c2185b'} onBlur={e=>e.target.style.borderColor='#e0e0e0'}/>
          <button type="submit" disabled={busy} style={{padding:'16px',borderRadius:50,border:'none',background:'#c2185b',color:'#fff',fontSize:16,fontWeight:700}}>{busy?'Sending...':'Send Reset Link'}</button>
        </form>}
    </div>
  )
}
