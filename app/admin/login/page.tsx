'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin(){
  const router=useRouter()
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)

  async function handleLogin(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError('')
    const res=await fetch('/api/admin-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})})
    if(res.ok){router.push('/admin');router.refresh()}
    else{setError('Incorrect password.');setPassword('');setLoading(false)}
  }

  return(
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#0f172a'}}>
      <div style={{width:'100%',maxWidth:'360px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{width:'56px',height:'56px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'18px',margin:'0 auto 16px',boxShadow:'0 8px 24px rgba(249,115,22,0.4)'}}>CL</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#fff',marginBottom:'4px'}}>Admin Access</h1>
          <p style={{color:'#475569',fontSize:'14px'}}>CampusLink KE Management</p>
        </div>

        {error&&<div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.2)',borderRadius:'10px',padding:'11px 14px',marginBottom:'16px',color:'#fca5a5',fontSize:'14px',textAlign:'center'}}>{error}</div>}

        <form onSubmit={handleLogin} style={{background:'rgba(255,255,255,0.04)',borderRadius:'16px',padding:'24px',border:'1px solid rgba(255,255,255,0.08)'}}>
          <label style={{fontSize:'12px',fontWeight:'600',color:'#64748b',display:'block',marginBottom:'8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Password</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter admin password" required autoFocus
            style={{width:'100%',background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:'10px',padding:'12px 14px',fontSize:'15px',outline:'none',color:'#fff',boxSizing:'border-box',marginBottom:'16px',letterSpacing:'2px'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
          <button type="submit" disabled={loading||!password}
            style={{width:'100%',background:loading||!password?'rgba(249,115,22,0.3)':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:loading||!password?'not-allowed':'pointer',boxShadow:loading||!password?'none':'0 4px 16px rgba(249,115,22,0.4)'}}>
            {loading?'Verifying...':'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
