'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function timeAgo(ts:string|null){
  if(!ts) return null
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  if(m<2) return{label:'Active now',color:'#22c55e'}
  if(m<60) return{label:`${m}m ago`,color:'#94a3b8'}
  const h=Math.floor(m/60)
  if(h<24) return{label:`${h}h ago`,color:'#94a3b8'}
  return{label:`${Math.floor(h/24)}d ago`,color:'#cbd5e1'}
}
function dot(ts:string|null){
  if(!ts) return '#d1d5db'
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  return m<5?'#22c55e':m<30?'#f59e0b':'#d1d5db'
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [gender,setGender]=useState('Auto')
  const [lookingFor,setLookingFor]=useState('All')
  const [tab,setTab]=useState<'nearby'|'newcomers'|'recommended'>('nearby')
  const [me,setMe]=useState<string|null>(null)
  const [friendMap,setFriendMap]=useState<Record<string,string>>({})
  const [sending,setSending]=useState<string|null>(null)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [liked,setLiked]=useState<Set<string>>(new Set())
  const [matched,setMatched]=useState<Set<string>>(new Set())
  const [liking,setLiking]=useState<string|null>(null)
  const [matchPop,setMatchPop]=useState<any>(null)

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      if(!user) return
      setMe(user.id)
      sb.from('profiles').select('gender').eq('id',user.id).maybeSingle().then(({data})=>{
        setGender(data?.gender==='male'?'female':data?.gender==='female'?'male':'All')
      })
      sb.from('friend_requests').select('receiver_id,sender_id,status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).not('status','eq','declined')
        .then(({data})=>{
          const m:Record<string,string>={}
          data?.forEach((r:any)=>{
            const o=r.sender_id===user.id?r.receiver_id:r.sender_id
            m[o]=r.status==='accepted'?'friends':r.sender_id===user.id?'pending_sent':'pending_received'
          })
          setFriendMap(m)
        })
      sb.from('likes').select('receiver_id').eq('sender_id',user.id)
        .then(({data})=>{ if(data) setLiked(new Set(data.map((l:any)=>l.receiver_id))) })
      sb.from('likes').select('sender_id').eq('receiver_id',user.id).then(({data:recv})=>{
        if(!recv) return
        const rSet=new Set(recv.map((l:any)=>l.sender_id))
        sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data:sent})=>{
          if(sent) setMatched(new Set(sent.filter((l:any)=>rSet.has(l.receiver_id)).map((l:any)=>l.receiver_id)))
        })
      })
      sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
      const t=setInterval(()=>sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id),180000)
      return()=>clearInterval(t)
    })
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})
    sb.from('profiles')
      .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,last_seen,created_at')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .then(({data})=>{ if(data) setUsers(data); setLoading(false) })
  },[])

  async function connect(rid:string){
    if(!me){router.push('/login');return}
    setSending(rid)
    const sb=createClient()
    await sb.from('friend_requests').insert([{sender_id:me,receiver_id:rid,status:'pending'}])
    setFriendMap(p=>({...p,[rid]:'pending_sent'}))
    setSending(null)
    toast('Request sent!','success')
    const {data:myProfile}=await sb.from('profiles').select('full_name').eq('id',me).maybeSingle()
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:rid,title:'New Friend Request',body:`${myProfile?.full_name||'Someone'} wants to connect`,url:'/dashboard'})
    }).catch(()=>{})
  }

  async function like(rid:string,name:string){
    if(!me){router.push('/login');return}
    if(liked.has(rid)) return
    setLiking(rid)
    setLiked(p=>new Set([...p,rid]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me,receiverId:rid})})
    const data=await res.json()
    if(data.isMatch){
      setMatched(p=>new Set([...p,rid]))
      setMatchPop({id:rid,name})
      setTimeout(()=>setMatchPop(null),5000)
    }
    setLiking(null)
  }

  const now=Date.now()
  let list=users.map(u=>({...u,
    _d:loc&&u.latitude?calcDist(loc.lat,loc.lng,u.latitude,u.longitude):9999,
    _new:now-new Date(u.created_at||0).getTime()
  }))
  if(tab==='nearby') list.sort((a,b)=>a._d-b._d)
  else if(tab==='newcomers') list.sort((a,b)=>a._new-b._new)
  else list.sort((a,b)=>((b.is_featured?2:0)+(b.is_premium?1:0))-((a.is_featured?2:0)+(a.is_premium?1:0)))

  const filtered=list.filter(s=>{
    const q=search.toLowerCase()
    return s.id!==me
      &&(!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q))
      &&(gender==='All'||gender==='Auto'||s.gender===gender)
      &&(lookingFor==='All'||s.looking_for===lookingFor)
  })

  return(
    <div style={{maxWidth:'480px',margin:'0 auto',padding:'0 0 90px',background:'#f5f6fa',minHeight:'100vh'}}>

      {/* Match popup */}
      {matchPop&&(
        <div onClick={()=>setMatchPop(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'36px 24px',textAlign:'center',maxWidth:'280px',width:'100%'}}>
            <div style={{fontSize:'48px',marginBottom:'8px'}}>💞</div>
            <h2 style={{fontSize:'22px',fontWeight:'900',color:'#be185d',marginBottom:'6px'}}>It's a Match!</h2>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px'}}>You and <strong>{matchPop.name}</strong> liked each other!</p>
            <button onClick={()=>{setMatchPop(null);router.push(`/profile/${matchPop.id}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:'12px',padding:'12px 0',fontSize:'14px',fontWeight:'700',cursor:'pointer',width:'100%'}}>
              View Profile →
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{background:'#fff',padding:'16px 16px 0',borderBottom:'1px solid #eee'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div>
            <h1 style={{fontSize:'22px',fontWeight:'900',color:'#0f172a',margin:0}}>People Nearby</h1>
            <p style={{fontSize:'12px',color:'#94a3b8',margin:'2px 0 0'}}>{filtered.length} people{loc?' · By distance':''}</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'2px solid #f1f5f9',marginBottom:'-1px'}}>
          {(['nearby','newcomers','recommended'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:'10px 4px',border:'none',background:'none',cursor:'pointer',
              fontSize:'13px',fontWeight:'600',
              color:tab===t?'#f97316':'#94a3b8',
              borderBottom:tab===t?'2px solid #f97316':'2px solid transparent',
              transition:'all 0.2s'
            }}>
              {t==='nearby'?'Nearby':t==='newcomers'?'New':' Top'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',padding:'12px 16px',background:'#fff',borderBottom:'1px solid #f1f5f9'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search name..."
          style={{flex:1,border:'1.5px solid #e2e8f0',borderRadius:'20px',padding:'8px 14px',fontSize:'13px',outline:'none',background:'#f8fafc'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={gender} onChange={e=>setGender(e.target.value)}
          style={{border:'1.5px solid #e2e8f0',borderRadius:'20px',padding:'8px 10px',fontSize:'12px',outline:'none',background:'#f8fafc',color:'#374151'}}>
          <option value="All">All</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
        </select>
        <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)}
          style={{border:'1.5px solid #e2e8f0',borderRadius:'20px',padding:'8px 10px',fontSize:'12px',outline:'none',background:'#f8fafc',color:'#374151'}}>
          <option value="All">For</option>
          <option value="friendship">Friends</option>
          <option value="relationship">Date</option>
          <option value="study">Study</option>
        </select>
      </div>

      {/* Cards grid */}
      <div style={{padding:'12px 12px 0',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        {loading
          ?[...Array(6)].map((_,i)=>(
            <div key={i} style={{borderRadius:'16px',overflow:'hidden',background:'#fff',boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
              <div style={{aspectRatio:'3/4',background:'linear-gradient(135deg,#f1f5f9,#e2e8f0)'}}/>
              <div style={{padding:'10px'}}>
                <div style={{height:'14px',background:'#f1f5f9',borderRadius:'6px',marginBottom:'8px'}}/>
                <div style={{height:'28px',background:'#f97316',borderRadius:'20px',opacity:0.2}}/>
              </div>
            </div>
          ))
          :filtered.map(s=>{
            const distKm=loc&&s.latitude?calcDist(loc.lat,loc.lng,s.latitude,s.longitude):null
            const distLabel=distKm!==null?(distKm<1?`${Math.round(distKm*1000)}m`:`${distKm.toFixed(1)}km`):null
            const isLiked=liked.has(s.id)
            const isMatch=matched.has(s.id)
            const active=timeAgo(s.last_seen)
            const onlineDot=dot(s.last_seen)
            const extras:string[]=Array.isArray(s.photos)?s.photos.filter((p:string)=>p&&p!==s.avatar_url).slice(0,3):[]
            const name=(s.full_name||'User').split(' ')[0]
            const fs=friendMap[s.id]
            return(
              <div key={s.id} style={{borderRadius:'16px',overflow:'hidden',background:'#fff',
                boxShadow:s.is_featured?'0 0 0 2px #f97316,0 4px 16px rgba(249,115,22,0.15)':'0 2px 10px rgba(0,0,0,0.08)',
                display:'flex',flexDirection:'column'}}>

                {/* Photo area */}
                <div style={{position:'relative',aspectRatio:'3/4.2',cursor:'pointer',background:'#e2e8f0',overflow:'hidden'}}
                  onClick={()=>router.push(`/profile/${s.id}`)}>
                  {s.avatar_url
                    ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} loading="lazy"/>
                    :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                      background:`linear-gradient(135deg,${s.is_premium?'#7c3aed,#6d28d9':'#f97316,#ea580c'})`,
                      color:'#fff',fontSize:'36px',fontWeight:'900'}}>{initials(s.full_name)}</div>
                  }
                  {/* Dark gradient at bottom */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:'50%',
                    background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 100%)',pointerEvents:'none'}}/>

                  {/* Online dot */}
                  <div style={{position:'absolute',top:8,right:8,width:11,height:11,borderRadius:'50%',
                    background:onlineDot,border:'2px solid white',boxShadow:'0 1px 3px rgba(0,0,0,0.4)'}}/>

                  {/* Top-left badges */}
                  <div style={{position:'absolute',top:8,left:8,display:'flex',flexDirection:'column',gap:3}}>
                    {s.is_premium&&<span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',
                      fontSize:'9px',padding:'2px 6px',borderRadius:'4px',fontWeight:'800'}}>VIP</span>}
                    {s.is_verified&&<span style={{background:'#2563eb',color:'#fff',
                      fontSize:'9px',padding:'2px 6px',borderRadius:'4px',fontWeight:'700'}}>✓</span>}
                  </div>

                  {/* Name + age over photo */}
                  <div style={{position:'absolute',bottom:extras.length?44:8,left:8,right:8}}>
                    <p style={{color:'#fff',fontWeight:'800',fontSize:'15px',margin:0,
                      textShadow:'0 1px 3px rgba(0,0,0,0.6)',lineHeight:1.2}}>
                      {name}{s.age?`, ${s.age}`:''}
                    </p>
                    {active&&<p style={{color:active.color==='#22c55e'?'#86efac':active.color,
                      fontSize:'10px',margin:'2px 0 0',fontWeight:'600'}}>{active.label}</p>}
                  </div>

                  {/* Distance */}
                  {distLabel&&<div style={{position:'absolute',bottom:extras.length?44:8,right:8,
                    background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:'9px',
                    padding:'2px 6px',borderRadius:'10px',fontWeight:'600'}}>
                    📍{distLabel}
                  </div>}

                  {/* Photo strip */}
                  {extras.length>0&&(
                    <div style={{position:'absolute',bottom:6,left:6,right:6,display:'flex',gap:3}}>
                      {extras.map((p:string,i:number)=>(
                        <div key={i} style={{flex:1,height:32,borderRadius:5,overflow:'hidden',
                          border:'1.5px solid rgba(255,255,255,0.8)'}}>
                          <img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div style={{padding:'8px 10px 10px',display:'flex',gap:6,alignItems:'center'}}>
                  <button onClick={e=>{e.stopPropagation();like(s.id,name)}}
                    style={{width:34,height:34,borderRadius:'50%',flexShrink:0,border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e8ecf0'}`,
                      background:isMatch?'#ec4899':isLiked?'#fdf2f8':'#fff',cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      transform:liking===s.id?'scale(1.3)':'scale(1)',transition:'all 0.15s'}}>
                    <svg width="13" height="12" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#bbb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/>
                    </svg>
                  </button>
                  <button onClick={e=>{e.stopPropagation();
                    if(!fs) connect(s.id)
                    else if(fs==='friends') router.push(`/profile/${s.id}`)
                    else if(fs==='pending_received') router.push('/dashboard')
                  }} style={{flex:1,height:34,borderRadius:20,border:'none',cursor:'pointer',
                    fontSize:'12px',fontWeight:'700',
                    background:fs==='friends'?'#16a34a':fs==='pending_sent'?'#94a3b8':fs==='pending_received'?'#2563eb':'#f97316',
                    color:'#fff',boxShadow:!fs?'0 2px 8px rgba(249,115,22,0.35)':'none',
                    transition:'all 0.2s'}}>
                    {sending===s.id?'..':fs==='friends'?'✓ Friends':fs==='pending_sent'?'Pending':fs==='pending_received'?'Accept':'Connect'}
                  </button>
                </div>
              </div>
            )
          })
        }
      </div>

      {!loading&&filtered.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px',margin:'16px'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div>
          <p style={{fontSize:'16px',fontWeight:'700',color:'#374151'}}>No one found</p>
          <p style={{fontSize:'13px',color:'#94a3b8',marginTop:'4px'}}>Try different filters</p>
        </div>
      )}
    </div>
  )
}
