'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function login(e:any) {
    e.preventDefault(); setLoading(true); setErr('')
    const {error} = await createClient().auth.signInWithPassword({email,password})
    if(error){setErr(error.message);setLoading(false);return}
    router.replace('/home')
  }

  async function google() {
    setLoading(true)
    await createClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/auth/callback?next=/home`}})
  }

  return (
    <div style={{minHeight:'100dvh',background:'#fff',display:'flex',flexDirection:'column'}}>
      <div style={{background:'linear-gradient(135deg,#f97316,#ec4899)',padding:'52px 28px 44px',textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:10}}>💕</div>
        <h1 style={{color:'#fff',fontSize:26,fontWeight:900,marginBottom:4,letterSpacing:'-0.5px'}}>Welcome Back</h1>
        <p style={{color:'rgba(255,255,255,0.8)',fontSize:14}}>Sign in to continue matching</p>
      </div>
      <form onSubmit={login} style={{flex:1,padding:'32px 24px',display:'flex',flexDirection:'column',gap:16}}>
        <Inp label="Email" type="email" value={email} onChange={(e:any)=>setEmail(e.target.value)} placeholder="you@gmail.com"/>
        <Inp label="Password" type="password" value={password} onChange={(e:any)=>setPassword(e.target.value)} placeholder="Your password"/>
        <div style={{textAlign:'right',marginTop:-6}}>
          <span onClick={()=>router.push('/forgot-password')} style={{fontSize:13,color:'#f97316',fontWeight:600,cursor:'pointer'}}>Forgot password?</span>
        </div>
        {err&&<p style={{color:'#ef4444',fontSize:13,background:'#fef2f2',padding:'10px 14px',borderRadius:10}}>{err}</p>}
        <button type="submit" disabled={loading}
          style={{width:'100%',padding:'16px',borderRadius:50,border:'none',background:loading?'#f1f5f9':'linear-gradient(135deg,#f97316,#ea580c)',color:loading?'#aaa':'#fff',fontSize:16,fontWeight:900,boxShadow:loading?'none':'0 4px 20px rgba(249,115,22,0.3)'}}>
          {loading?'Signing in...':'Sign In'}
        </button>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{flex:1,height:1,background:'#e8e8e8'}}/><span style={{color:'#bbb',fontSize:12}}>or</span><div style={{flex:1,height:1,background:'#e8e8e8'}}/>
        </div>
        <button type="button" onClick={google}
          style={{width:'100%',padding:'15px',borderRadius:50,border:'1.5px solid #e8e8e8',background:'#fff',color:'#374151',fontSize:15,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <span style={{fontWeight:900,fontSize:16}}>G</span> Continue with Google
        </button>
        <p style={{textAlign:'center',color:'#94a3b8',fontSize:14,marginTop:4}}>
          No account? <span onClick={()=>router.push('/register')} style={{color:'#f97316',fontWeight:700,cursor:'pointer'}}>Join Free</span>
        </p>
      </form>
    </div>
  )
}

function Inp({label,...props}:any){
  const [f,setF]=useState(false)
  return(
    <div>
      <label style={{fontSize:13,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>{label}</label>
      <input {...props} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:'100%',border:`1.5px solid ${f?'#f97316':'#e8e8e8'}`,borderRadius:14,padding:'13px 16px',fontSize:15,outline:'none',transition:'border 0.2s'}}/>
    </div>
  )
}
