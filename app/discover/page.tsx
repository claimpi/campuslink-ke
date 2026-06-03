'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function ini(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function Discover() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<any[]>([])
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState<Set<string>>(new Set())

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}}:any)=>{
      if(!user){router.replace('/');return}
      setMe(user)
      sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data}:any)=>{if(data)setLiked(new Set(data.map((l:any)=>l.receiver_id)))})
      sb.from('profiles').select('id,full_name,avatar_url,photos,age,looking_for,bio,location_name,is_premium,is_verified').neq('id',user.id)
        .order('is_featured',{ascending:false}).order('last_seen',{ascending:false,nullsFirst:false}).limit(60)
        .then(({data}:any)=>{if(data)setProfiles(data);setLoading(false)})
    })
  },[])

  async function like(id:string,name:string){
    if(!me)return
    if(liked.has(id)){setLiked(p=>{const n=new Set(p);n.delete(id);return n});return}
    setLiked(p=>new Set([...p,id]))
    await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me.id,receiverId:id})})
  }

  return (
    <div style={{minHeight:'100dvh',background:'#f5f5f5',paddingBottom:70}}>
      <div style={{background:'#fff',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #f0f0f0',position:'sticky',top:0,zIndex:50}}>
        <h1 style={{fontSize:17,fontWeight:900,color:'#111'}}>🔥 Matches</h1>
        <button onClick={()=>router.push('/home')} style={{background:'none',border:'none',color:'#f97316',fontWeight:700,fontSize:13}}>← Swipe mode</button>
      </div>
      {loading?<div style={{display:'flex',justifyContent:'center',padding:48}}><div className="spin" style={{width:32,height:32,border:'3px solid #ffe4d6',borderTopColor:'#f97316',borderRadius:'50%'}}/></div>
      :<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2,padding:2}}>
        {profiles.map(p=>{
          const isLiked=liked.has(p.id)
          return(
            <div key={p.id} style={{position:'relative',background:'#222',overflow:'hidden',cursor:'pointer',aspectRatio:'3/4'}} onClick={()=>router.push(`/profile/${p.id}`)}>
              {p.avatar_url?<img src={p.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" loading="lazy"/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f97316,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,color:'#fff',fontWeight:900}}>{ini(p.full_name)}</div>}
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%)'}}/>
              {p.is_premium&&<div style={{position:'absolute',top:8,left:8,background:'#f97316',color:'#fff',fontSize:8,fontWeight:800,padding:'2px 6px',borderRadius:4}}>VIP</div>}
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px 10px 8px'}}>
                <p style={{color:'#fff',fontWeight:800,fontSize:13,margin:'0 0 2px'}}>{p.full_name?.split(' ')[0]} {p.age&&<span style={{fontWeight:400}}>{p.age}</span>}</p>
                {p.location_name&&<p style={{color:'rgba(255,255,255,0.7)',fontSize:11,margin:0}}>📍 {p.location_name}</p>}
              </div>
              <button onClick={e=>{e.stopPropagation();like(p.id,p.full_name)}}
                style={{position:'absolute',bottom:8,right:8,width:34,height:34,borderRadius:'50%',border:`2px solid ${isLiked?'#ec4899':'rgba(255,255,255,0.5)'}`,background:isLiked?'#ec4899':'rgba(0,0,0,0.3)',color:'#fff',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {isLiked?'❤️':'🤍'}
              </button>
            </div>
          )
        })}
      </div>}
      <BottomNav active="discover" router={router}/>
    </div>
  )
}

function BottomNav({active,router}:any){
  return(
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:'#fff',borderTop:'1px solid #f0f0f0',display:'flex',zIndex:100,paddingBottom:'env(safe-area-inset-bottom)'}}>
      {[{icon:'💕',label:'Discover',path:'/home'},{icon:'🔥',label:'Matches',path:'/discover'},{icon:'💬',label:'Chat',path:'/chat'},{icon:'👤',label:'Profile',path:'/dashboard'}].map(t=>(
        <button key={t.path} onClick={()=>router.push(t.path)} style={{flex:1,padding:'10px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',position:'relative'}}>
          <span style={{fontSize:20}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:active===t.path.slice(1)?700:400,color:active===t.path.slice(1)?'#f97316':'#bbb'}}>{t.label}</span>
          {active===t.path.slice(1)&&<div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:20,height:3,borderRadius:2,background:'#f97316'}}/>}
        </button>
      ))}
    </div>
  )
}
