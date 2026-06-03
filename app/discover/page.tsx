'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Stories from '@/components/ui/Stories'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [filtered,setFiltered]=useState<any[]>([])
  const [tab,setTab]=useState<'recommend'|'new'|'nearby'>('recommend')
  const [loading,setLoading]=useState(true)
  const [me,setMe]=useState<string|null>(null)
  const [liked,setLiked]=useState<Set<string>>(new Set())
  const [matched,setMatched]=useState<Set<string>>(new Set())
  const [matchPop,setMatchPop]=useState<any>(null)
  const [dailyReward,setDailyReward]=useState<{coins:number,streak:number}|null>(null)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [searchOpen,setSearchOpen]=useState(false)
  const [searchQ,setSearchQ]=useState('')

  useEffect(()=>{
    const sb=createClient()
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(async p=>{
      setLoc({lat:p.coords.latitude,lng:p.coords.longitude})
      const {data:{user}}=await sb.auth.getUser()
      if(user){
        const {data:prof}=await sb.from('profiles').select('latitude,longitude').eq('id',user.id).maybeSingle()
        const same=prof?.latitude&&Math.abs(prof.latitude-p.coords.latitude)<0.01
        if(!same){
          try{
            const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`)
            const g=await r.json()
            const town=g.address?.suburb||g.address?.city||g.address?.town||g.address?.county||'Kenya'
            await sb.from('profiles').update({latitude:p.coords.latitude,longitude:p.coords.longitude,location_name:town}).eq('id',user.id)
          }catch{
            await sb.from('profiles').update({latitude:p.coords.latitude,longitude:p.coords.longitude}).eq('id',user.id)
          }
        }
      }
    },()=>{})

    sb.auth.getUser().then(({data:{user}})=>{
      if(user){
        setMe(user.id)
        sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data})=>{if(data)setLiked(new Set(data.map((l:any)=>l.receiver_id)))})
        sb.from('likes').select('sender_id').eq('receiver_id',user.id).then(({data:recv})=>{
          if(!recv)return
          const rSet=new Set(recv.map((l:any)=>l.sender_id))
          sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data:sent})=>{
            if(sent)setMatched(new Set(sent.filter((l:any)=>rSet.has(l.receiver_id)).map((l:any)=>l.receiver_id)))
          })
        })
        fetch('/api/daily-reward',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})})
          .then(r=>r.json()).then(data=>{if(data.success)setDailyReward({coins:data.coins,streak:data.streak})})

        sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
        const t=setInterval(()=>sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id),180000)

        sb.from('profiles').select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,last_seen,created_at')
          .neq('id',user.id)
          .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
          .order('last_seen',{ascending:false,nullsFirst:false}).limit(80)
          .then(({data:users})=>{ if(users){setUsers(users);setFiltered(users)} setLoading(false) })

        return ()=>clearInterval(t)
      } else {
        sb.from('profiles').select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,last_seen,created_at')
          .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
          .order('last_seen',{ascending:false,nullsFirst:false}).limit(80)
          .then(({data:users})=>{ if(users){setUsers(users);setFiltered(users)} setLoading(false) })
      }
    })
  },[])

  useEffect(()=>{
    let list=[...users]
    if(searchQ.trim()) list=list.filter(u=>(u.full_name||'').toLowerCase().includes(searchQ.toLowerCase())||(u.location_name||'').toLowerCase().includes(searchQ.toLowerCase()))
    if(tab==='new') list=[...list].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,40)
    else if(tab==='nearby'&&loc) list=[...list].filter(u=>u.latitude&&u.longitude).sort((a,b)=>calcDist(loc.lat,loc.lng,a.latitude,a.longitude)-calcDist(loc.lat,loc.lng,b.latitude,b.longitude)).slice(0,40)
    setFiltered(list)
  },[tab,users,searchQ,loc])

  async function like(e:React.MouseEvent,rid:string,name:string){
    e.stopPropagation()
    if(!me){router.push('/register');return}
    if(liked.has(rid))return
    setLiked(p=>new Set([...p,rid]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me,receiverId:rid})})
    const data=await res.json()
    if(data.isMatch){
      setMatched(p=>new Set([...p,rid]))
      setMatchPop({id:rid,name})
      setTimeout(()=>setMatchPop(null),5000)
    }
  }

  const locked=!me

  return(
    <div style={{maxWidth:480,margin:'0 auto',background:'#f5f5f5',minHeight:'100dvh',paddingBottom:70,fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif'}}>

      {/* Daily reward popup */}
      {dailyReward&&(
        <div onClick={()=>setDailyReward(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:9998,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:24,padding:'32px 24px',textAlign:'center',maxWidth:280,width:'100%'}}>
            <div style={{fontSize:52,marginBottom:8}}>🎁</div>
            <h2 style={{fontSize:20,fontWeight:900,color:'#0f172a',marginBottom:4}}>Daily Reward!</h2>
            <p style={{fontSize:13,color:'#64748b',marginBottom:16}}>Day {dailyReward.streak} streak</p>
            <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:16,padding:'16px',marginBottom:16}}>
              <p style={{color:'#fff',fontSize:32,fontWeight:900,margin:0}}>+{dailyReward.coins} 🪙</p>
              <p style={{color:'rgba(255,255,255,0.85)',fontSize:12,margin:'4px 0 0'}}>
                {dailyReward.streak===7?'🔥 Week streak!':dailyReward.streak===3?'🔥 3-day streak!':'Coins added to your wallet'}
              </p>
            </div>
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:16}}>
              {[1,2,3,4,5,6,7].map(d=>(
                <div key={d} style={{width:28,height:28,borderRadius:'50%',background:d<=dailyReward.streak?'#f97316':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:d<=dailyReward.streak?'#fff':'#94a3b8'}}>
                  {d===7?'🔥':d}
                </div>
              ))}
            </div>
            <button onClick={()=>setDailyReward(null)} style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer'}}>
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}

      {/* Match popup */}
      {matchPop&&(
        <div onClick={()=>setMatchPop(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9997,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:24,padding:'32px 24px',textAlign:'center',maxWidth:300,width:'100%'}}>
            <div style={{fontSize:56,marginBottom:8}}>💞</div>
            <h2 style={{fontSize:22,fontWeight:900,color:'#0f172a',marginBottom:6}}>It's a Match!</h2>
            <p style={{fontSize:14,color:'#64748b',marginBottom:20}}>You and {matchPop.name} liked each other</p>
            <button onClick={()=>{setMatchPop(null);router.push(`/chat/${matchPop.id}`)}}
              style={{width:'100%',background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:12,padding:'13px',fontSize:15,fontWeight:800,cursor:'pointer',marginBottom:8}}>
              💬 Send a Message
            </button>
            <button onClick={()=>setMatchPop(null)} style={{width:'100%',background:'#f1f5f9',color:'#374151',border:'none',borderRadius:12,padding:'13px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
              Keep Browsing
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{background:'#fff',padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #ebebeb',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#f97316,#ea580c)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:13}}>CL</div>
          <span style={{fontWeight:800,fontSize:16,color:'#0f172a',letterSpacing:'-0.3px'}}>CampusLink <span style={{color:'#f97316'}}>KE</span></span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>setSearchOpen(s=>!s)} style={{width:36,height:36,borderRadius:'50%',background:'#f5f5f5',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🔍</button>
          {me
            ?<button onClick={()=>router.push('/dashboard')} style={{width:36,height:36,borderRadius:'50%',background:'#f97316',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:800}}>Me</button>
            :<button onClick={()=>router.push('/register')} style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:20,padding:'7px 16px',fontSize:13,fontWeight:800,cursor:'pointer'}}>Join Free</button>
          }
        </div>
      </div>

      {/* Search bar */}
      {searchOpen&&(
        <div style={{background:'#fff',padding:'10px 16px',borderBottom:'1px solid #ebebeb'}}>
          <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
            placeholder="Search by name or location..."
            style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:24,padding:'10px 18px',fontSize:14,outline:'none',background:'#f8fafc',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
      )}

      {/* Tabs */}
      <div style={{background:'#fff',padding:'0 16px',borderBottom:'1px solid #ebebeb',display:'flex',gap:4}}>
        {(['recommend','new','nearby'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:'13px 0',fontSize:14,fontWeight:tab===t?700:500,
            color:tab===t?'#f97316':'#94a3b8',background:'none',border:'none',cursor:'pointer',
            borderBottom:tab===t?'2.5px solid #f97316':'2.5px solid transparent',
            transition:'all 0.2s',textTransform:'capitalize'}}>
            {t==='recommend'?'Discover':t==='new'?'New':' Nearby'}
          </button>
        ))}
      </div>

      {/* Stories */}
      <Stories myId={me}/>

      {/* Feed */}
      <div style={{padding:'8px 0'}}>
        {loading
          ?[...Array(3)].map((_,i)=>(
            <div key={i} style={{background:'#fff',marginBottom:1,padding:16,display:'flex',gap:14,alignItems:'center'}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:'#f1f5f9',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{height:16,background:'#f1f5f9',borderRadius:8,marginBottom:8,width:'60%'}}/>
                <div style={{height:12,background:'#f1f5f9',borderRadius:8,width:'40%'}}/>
              </div>
            </div>
          ))
          :filtered.map(s=>{
            const photos:string[]=Array.isArray(s.photos)?s.photos:[]
            const allPhotos=[s.avatar_url,...photos.filter((p:string)=>p&&p!==s.avatar_url)].filter(Boolean)
            const name=s.full_name||'User'
            const distKm=loc&&s.latitude?calcDist(loc.lat,loc.lng,s.latitude,s.longitude):null
            const isLiked=liked.has(s.id)
            const isMatch=matched.has(s.id)

            return(
              <div key={s.id} style={{background:'#fff',marginBottom:1,cursor:'pointer'}} onClick={()=>router.push(`/profile/${s.id}`)}>

                {/* Profile header */}
                <div style={{padding:'14px 16px',display:'flex',gap:12,alignItems:'flex-start'}}>
                  {/* Avatar */}
                  <div style={{position:'relative',flexShrink:0}} onClick={e=>{e.stopPropagation();router.push(`/profile/${s.id}`)}}>
                    <div style={{width:64,height:64,borderRadius:'50%',overflow:'hidden',border:s.is_premium?'2.5px solid #f97316':'2px solid #e8e8e8'}}>
                      {s.avatar_url
                        ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} loading="lazy"/>
                        :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900}}>{initials(name)}</div>
                      }
                    </div>
                    {s.is_premium&&<div style={{position:'absolute',bottom:-1,left:'50%',transform:'translateX(-50%)',background:'#f97316',color:'#fff',fontSize:8,fontWeight:800,padding:'1px 5px',borderRadius:4,whiteSpace:'nowrap'}}>VIP</div>}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                      <span style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{name}</span>
                      {s.is_verified&&<span style={{fontSize:14,color:'#2563eb'}}>✓</span>}
                      {isMatch&&<span style={{fontSize:11,background:'#fdf2f8',color:'#be185d',padding:'1px 6px',borderRadius:10,fontWeight:700}}>💞 Match</span>}
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4}}>
                      {s.age&&<span style={{background:'#fff0eb',color:'#c2410c',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>{s.age} yrs</span>}
                      {s.looking_for&&<span style={{background:'#fdf2f8',color:'#be185d',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>
                        {s.looking_for==='relationship'?'💕 Dating':s.looking_for==='friendship'?'🤝 Friends':s.looking_for==='study'?'📚 Study':'🌐 Network'}
                      </span>}
                      {distKm!==null&&<span style={{background:'#f0fdf4',color:'#15803d',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>📍{distKm<0.1?'<0.1':distKm.toFixed(1)}km</span>}
                      {s.location_name&&!distKm&&<span style={{background:'#f8fafc',color:'#64748b',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:500}}>{s.location_name}</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div onClick={e=>e.stopPropagation()} style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center',flexShrink:0}}>
                    <button onClick={()=>locked?router.push('/register'):router.push(`/chat/${s.id}`)}
                      style={{background:locked?'#f1f5f9':'linear-gradient(135deg,#f97316,#fb923c)',color:locked?'#94a3b8':'#fff',border:'none',borderRadius:22,padding:'8px 18px',fontSize:13,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:4,boxShadow:locked?'none':'0 2px 10px rgba(249,115,22,0.35)'}}>
                      <span>💬</span> Hi
                    </button>
                    <button onClick={e=>locked?router.push('/register'):like(e,s.id,name)}
                      style={{width:34,height:34,borderRadius:'50%',border:`1.5px solid ${isMatch?'#ec4899':isLiked?'#ec4899':'#e8e8e8'}`,background:isMatch?'#ec4899':isLiked?'#fdf2f8':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:isMatch?'0 2px 8px rgba(236,72,153,0.4)':'none'}}>
                      <svg width="14" height="13" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#ccc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Photo strip */}
                {allPhotos.length>0&&(
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(allPhotos.length,4)},1fr)`,gap:1,marginBottom:1}}>
                    {allPhotos.slice(0,4).map((p:string,i:number)=>(
                      <div key={i} style={{aspectRatio:'1',overflow:'hidden',background:'#f1f5f9',position:'relative'}}>
                        <img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" loading="lazy"/>
                        {i===3&&allPhotos.length>4&&(
                          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:18}}>
                            +{allPhotos.length-4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        }

        {!loading&&filtered.length===0&&(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:48,marginBottom:12}}>🌍</div>
            <p style={{fontWeight:800,color:'#0f172a',fontSize:16,marginBottom:6}}>No one found nearby</p>
            <p style={{color:'#94a3b8',fontSize:13}}>Try switching to Discover tab</p>
          </div>
        )}
      </div>
    </div>
  )
}
