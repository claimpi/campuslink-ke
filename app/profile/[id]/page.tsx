'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return n?.split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)||'??'}

export default function ProfilePage(){
  const {id}=useParams()
  const router=useRouter()
  const [profile,setProfile]=useState<any>(null)
  const [currentUser,setCurrentUser]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [showUnlock,setShowUnlock]=useState(false)
  const [unlocked,setUnlocked]=useState(false)
  const [paying,setPaying]=useState(false)

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>setCurrentUser(user))
    sb.from('profiles').select('*').eq('id',id as string).maybeSingle().then(({data})=>{
      setProfile(data)
      setLoading(false)
      // increment views
      if(data) sb.from('profiles').update({profile_views:(data.profile_views||0)+1}).eq('id',id as string)
    })
  },[id])

  async function handleUnlock(){
    if(!currentUser){router.push('/login');return}
    setPaying(true)
    try{
      const sb=createClient()
      const {data:curr}=await sb.from('profiles').select('full_name,whatsapp_number').eq('id',currentUser.id).maybeSingle()
      const res=await fetch('/api/pesapal',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:currentUser.id,userEmail:currentUser.email,userName:curr?.full_name||currentUser.email,phone:curr?.whatsapp_number||'',paymentType:'unlock',targetId:id})})
      const data=await res.json()
      if(data.redirectUrl) window.location.href=data.redirectUrl
      else{alert('Payment failed: '+data.error);setPaying(false)}
    }catch(e){alert('Something went wrong');setPaying(false)}
  }

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#94a3b8'}}>Loading...</div>
  if(!profile) return <div style={{textAlign:'center',padding:'80px',color:'#94a3b8'}}><p style={{fontSize:'18px',fontWeight:'600',color:'#374151'}}>Profile not found</p><Link href="/discover" style={{color:'#f97316',marginTop:'12px',display:'block'}}>Browse students</Link></div>

  return(
    <div style={{maxWidth:'680px',margin:'0 auto',padding:'32px 20px'}}>
      <Link href="/discover" style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',display:'block'}}>← Back to students</Link>

      <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.06)'}}>
        {/* Cover */}
        <div style={{height:'100px',background:'linear-gradient(135deg,#f97316,#ea580c)',position:'relative'}}>
          {profile.is_featured&&<span style={{position:'absolute',top:'12px',right:'12px',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'4px 10px',borderRadius:'50px',backdropFilter:'blur(4px)'}}>FEATURED</span>}
        </div>

        <div style={{padding:'0 24px 28px'}}>
          {/* Avatar */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'-28px',marginBottom:'16px'}}>
            {profile.avatar_url
              ?<img src={profile.avatar_url} style={{width:'64px',height:'64px',borderRadius:'50%',objectFit:'cover',border:'3px solid #fff',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}/>
              :<div style={{width:'64px',height:'64px',borderRadius:'50%',background:profile.is_premium?'#f5f3ff':'#fff7ed',color:profile.is_premium?'#7c3aed':'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'20px',border:'3px solid #fff',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>{initials(profile.full_name)}</div>
            }
            <div style={{display:'flex',gap:'6px',marginBottom:'4px'}}>
              {profile.is_top_student&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'3px 8px',borderRadius:'50px',fontWeight:'700',border:'1px solid #fed7aa'}}>Top Student</span>}
              {profile.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'3px 8px',borderRadius:'50px',fontWeight:'700',border:'1px solid #ddd6fe'}}>Premium</span>}
            </div>
          </div>

          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>{profile.full_name}</h1>
          <p style={{fontSize:'14px',color:'#64748b',marginBottom:'2px'}}>{profile.course} · Year {profile.year_of_study}</p>
          <p style={{fontSize:'14px',color:'#94a3b8',marginBottom:'16px'}}>{profile.university}</p>

          {profile.bio&&<p style={{fontSize:'14px',color:'#374151',lineHeight:'1.7',marginBottom:'16px',padding:'14px',background:'#f8fafc',borderRadius:'10px'}}>{profile.bio}</p>}

          {profile.interests&&profile.interests.length>0&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'20px'}}>
              {profile.interests.map((i:string)=><span key={i} style={{background:'#f1f5f9',color:'#475569',fontSize:'12px',padding:'4px 10px',borderRadius:'50px'}}>{i}</span>)}
            </div>
          )}

          <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'20px'}}>{profile.profile_views||0} profile views</p>

          {/* Unlock section */}
          <div id="unlock" style={{background:'#f8fafc',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px'}}>
            <h3 style={{fontWeight:'700',color:'#0f172a',fontSize:'15px',marginBottom:'6px'}}>Connect on WhatsApp</h3>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'16px'}}>Pay KES 20 via M-Pesa to unlock this student's WhatsApp number and connect directly.</p>
            {unlocked&&profile.whatsapp_number ? (
              <a href={`https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                style={{display:'block',background:'#16a34a',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',textAlign:'center'}}>
                Open WhatsApp — {profile.whatsapp_number}
              </a>
            ):(
              <button onClick={handleUnlock} disabled={paying} style={{width:'100%',background:paying?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:paying?'not-allowed':'pointer',boxShadow:paying?'none':'0 4px 14px rgba(249,115,22,0.3)'}}>
                {paying?'Redirecting to M-Pesa...':'Unlock for KES 20'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
