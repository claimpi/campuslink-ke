'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function ProfilePage(){
  const {id}=useParams()
  const router=useRouter()
  const [profile,setProfile]=useState<any>(null)
  const [currentUser,setCurrentUser]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [paying,setPaying]=useState(false)
  const [isUnlocked,setIsUnlocked]=useState(false)
  const [activePhoto,setActivePhoto]=useState<string|null>(null)
  const [copied,setCopied]=useState(false)

  function shareProfile(){
    const url = `https://campuslink-ke.vercel.app/profile/${id}`
    if(navigator.share){
      navigator.share({title:`${profile?.full_name} — CampusLink KE`,text:`Connect with ${profile?.full_name} on CampusLink KE`,url})
    } else {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(()=>setCopied(false),2000)
    }
  }

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>setCurrentUser(user))
    // Check if already unlocked
    sb.auth.getUser().then(({data:{user}})=>{
      if(user){
        sb.from('unlock_requests').select('id').eq('requester_id',user.id).eq('target_id',id as string).eq('status','approved').maybeSingle()
          .then(({data})=>{ if(data) setIsUnlocked(true) })
        // Also check payment_requests
        sb.from('payment_requests').select('id').eq('user_id',user.id).eq('type','unlock').eq('status','approved').ilike('reference',`%${(id as string).slice(0,6)}%`)
          .then(({data})=>{ if(data&&data.length>0) setIsUnlocked(true) })
      }
    })
    sb.from('profiles').select('*').eq('id',id as string).maybeSingle().then(({data})=>{
      setProfile(data)
      setLoading(false)
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
        body:JSON.stringify({userId:currentUser.id,userEmail:currentUser.email,userName:curr?.full_name||currentUser.email,
          phone:curr?.whatsapp_number||'',paymentType:'unlock',targetId:id})})
      const data=await res.json()
      if(data.redirectUrl) window.location.href=data.redirectUrl
      else{alert(data.error||'Payment failed');setPaying(false)}
    }catch{alert('Something went wrong');setPaying(false)}
  }

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:'32px',height:'32px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if(!profile) return(
    <div style={{textAlign:'center',padding:'80px 20px'}}>
      <p style={{fontSize:'18px',fontWeight:'700',color:'#0f172a',marginBottom:'8px'}}>Profile not found</p>
      <Link href="/" style={{color:'#f97316',fontSize:'14px'}}>← Back to students</Link>
    </div>
  )

  const photos = Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : []
  const interests = Array.isArray(profile.interests) ? profile.interests.filter(Boolean) : []

  return(
    <div style={{maxWidth:'780px',margin:'0 auto',padding:'28px 20px'}}>
      <Link href="/" style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',display:'inline-block'}}>← Back to students</Link>

      <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>

        {/* Top section */}
        <div style={{display:'flex',gap:'0',flexWrap:'wrap'}}>
          {/* Left: Avatar + basic info */}
          <div style={{flex:'1',minWidth:'260px',padding:'28px'}}>
            <div style={{display:'flex',gap:'16px',alignItems:'flex-start',marginBottom:'16px'}}>
              {profile.avatar_url
                ?<img src={profile.avatar_url} style={{width:'80px',height:'80px',borderRadius:'14px',objectFit:'cover',border:'1px solid #e2e8f0',flexShrink:0}}/>
                :<div style={{width:'80px',height:'80px',borderRadius:'14px',background:'#f8fafc',color:'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'24px',border:'1px solid #e2e8f0',flexShrink:0}}>{initials(profile.full_name)}</div>
              }
              <div style={{paddingTop:'4px'}}>
                <h1 style={{fontSize:'20px',fontWeight:'800',color:'#0f172a',marginBottom:'5px',lineHeight:'1.2'}}>{profile.full_name}</h1>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {profile.is_top_student&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #fed7aa'}}>Top Student</span>}
                  {profile.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #ddd6fe'}}>Premium</span>}
                  {profile.is_featured&&<span style={{background:'#fff7ed',color:'#f97316',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #fed7aa'}}>Featured</span>}
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
              {profile.course&&(
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#94a3b8',width:'60px',flexShrink:0}}>Course</span>
                  <span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.course}</span>
                </div>
              )}
              {profile.university&&(
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#94a3b8',width:'60px',flexShrink:0}}>University</span>
                  <span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.university}</span>
                </div>
              )}
              {profile.year_of_study&&(
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#94a3b8',width:'60px',flexShrink:0}}>Year</span>
                  <span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>Year {profile.year_of_study}</span>
                </div>
              )}
              {profile.status&&(
                <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'#94a3b8',width:'60px',flexShrink:0}}>Status</span>
                  <span style={{fontSize:'13px',fontWeight:'600',padding:'2px 10px',borderRadius:'50px',
                    background:profile.status==='single'?'#f0fdf4':profile.status==='taken'?'#fef2f2':'#fff7ed',
                    color:profile.status==='single'?'#16a34a':profile.status==='taken'?'#dc2626':'#ea580c',
                    border:`1px solid ${profile.status==='single'?'#bbf7d0':profile.status==='taken'?'#fecaca':'#fed7aa'}`}}>
                    {profile.status==='single'?'Single 💚':profile.status==='taken'?'Taken ❤️':"It's complicated 🤔"}
                  </span>
                </div>
              )}
            </div>

            {interests.length>0&&(
              <div style={{marginBottom:'16px'}}>
                <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'7px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'}}>Interests</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {interests.map((i:string)=>(
                    <span key={i} style={{background:'#f8fafc',color:'#475569',fontSize:'12px',padding:'4px 10px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>{i}</span>
                  ))}
                </div>
              </div>
            )}

            <p style={{fontSize:'12px',color:'#cbd5e1',marginBottom:'12px'}}>{profile.profile_views||0} profile views</p>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <button onClick={shareProfile} style={{display:'flex',alignItems:'center',gap:'6px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',color:'#374151',cursor:'pointer'}}>
              {copied ? '✅ Link copied!' : '🔗 Share Profile'}
            </button>
            <a href={`https://wa.me/?text=Connect%20with%20${encodeURIComponent(profile.full_name)}%20on%20CampusLink%20KE%20https://campuslink-ke.vercel.app/profile/${id}`}
              target="_blank" rel="noopener noreferrer"
              style={{display:'flex',alignItems:'center',gap:'6px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',color:'#16a34a'}}>
              💬 Share on WhatsApp
            </a>
            <a href={`https://twitter.com/intent/tweet?text=Connect%20with%20${encodeURIComponent(profile.full_name)}%20on%20CampusLink%20KE&url=https://campuslink-ke.vercel.app/profile/${id}`}
              target="_blank" rel="noopener noreferrer"
              style={{display:'flex',alignItems:'center',gap:'6px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',color:'#2563eb'}}>
              𝕏 Share
            </a>
          </div>
          </div>

          {/* Right: Bio + Connect */}
          <div style={{flex:'1',minWidth:'260px',padding:'28px',borderLeft:'1px solid #f1f5f9',background:'#fafafa'}}>
            {profile.bio&&(
              <div style={{marginBottom:'20px'}}>
                <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'8px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'}}>About</p>
                <p style={{fontSize:'14px',color:'#374151',lineHeight:'1.7'}}>{profile.bio}</p>
              </div>
            )}

            {/* Connect box */}
            <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'18px'}}>
              <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>Connect on WhatsApp</p>
              <p style={{fontSize:'12px',color:'#64748b',marginBottom:'14px',lineHeight:'1.5'}}>Pay KES 20 via M-Pesa to unlock this student's WhatsApp number.</p>
              {isUnlocked && profile.whatsapp_number ? (
                <a href={`https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{display:'block',background:'#16a34a',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',textAlign:'center'}}>
                  💬 Open WhatsApp — {profile.whatsapp_number}
                </a>
              ) : (
                <button onClick={handleUnlock} disabled={paying}
                  style={{width:'100%',background:paying?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:paying?'not-allowed':'pointer',boxShadow:paying?'none':'0 4px 12px rgba(249,115,22,0.3)'}}>
                  {paying?'Redirecting to M-Pesa...':'Unlock for KES 20'}
                </button>
              )}
              {!currentUser&&<p style={{fontSize:'11px',color:'#94a3b8',textAlign:'center',marginTop:'8px'}}>
                <Link href="/login" style={{color:'#f97316',fontWeight:'600'}}>Sign in</Link> to connect
              </p>}
            </div>
          </div>
        </div>

        {/* Photo gallery */}
        {photos.length>0&&(
          <div style={{padding:'0 28px 28px',borderTop:'1px solid #f1f5f9'}}>
            <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'12px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px',paddingTop:'20px'}}>Photos ({photos.length})</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'8px'}}>
              {photos.map((url:string,i:number)=>(
                <div key={i} onClick={()=>setActivePhoto(url)} style={{aspectRatio:'1',borderRadius:'10px',overflow:'hidden',cursor:'pointer',border:'1px solid #e2e8f0'}}>
                  <img src={url} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.2s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1)'}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {activePhoto&&(
        <div onClick={()=>setActivePhoto(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'20px',cursor:'pointer'}}>
          <img src={activePhoto} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'12px',objectFit:'contain'}}/>
          <button onClick={()=>setActivePhoto(null)} style={{position:'absolute',top:'20px',right:'20px',background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',width:'40px',height:'40px',color:'#fff',fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
        </div>
      )}
    </div>
  )
}
