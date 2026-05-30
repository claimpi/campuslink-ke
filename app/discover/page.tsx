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
  if(!ts) return 'Never'
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  if(m<2) return 'Active now'
  if(m<60) return `${m}m ago`
  const h=Math.floor(m/60)
  if(h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}
function isOnline(ts:string|null){
  if(!ts) return false
  return Math.floor((Date.now()-new Date(ts).getTime())/60000)<5
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [searchOpen,setSearchOpen]=useState(false)
  const [searchQ,setSearchQ]=useState('')
  const [gender,setGender]=useState('Auto')
  const [tab,setTab]=useState<'recommended'|'newcomers'|'nearby'>('recommended')
  const [me,setMe]=useState<string|null>(null)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [liked,setLiked]=useState<Set<string>>(new Set())
  const [matched,setMatched]=useState<Set<string>>(new Set())
  const [hiSent,setHiSent]=useState<Set<string>>(new Set())
  const [matchPop,setMatchPop]=useState<any>(null)

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      if(!user) return
      setMe(user.id)
      sb.from('profiles').select('gender').eq('id',user.id).maybeSingle().then(({data})=>{
        setGender(data?.gender==='male'?'female':data?.gender==='female'?'male':'All')
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
      .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,university,location_name,latitude,longitude,last_seen,created_at')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .order('last_seen',{ascending:false})
      .limit(60)
      .then(({data})=>{ if(data) setUsers(data); setLoading(false) })
  },[])

  async function sendHi(e:React.MouseEvent, rid:string, name:string){
    e.stopPropagation()
    if(!me){router.push('/login');return}
    // Open chat directly
    router.push(`/chat/${rid}`)
  }

  async function like(e:React.MouseEvent, rid:string, name:string){
    e.stopPropagation()
    if(!me){router.push('/login');return}
    if(liked.has(rid)) return
    setLiked(p=>new Set([...p,rid]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me,receiverId:rid})})
    const data=await res.json()
    if(data.isMatch){
      setMatched(p=>new Set([...p,rid]))
      setMatchPop({id:rid,name})
      setTimeout(()=>setMatchPop(null),5000)
    }
  }

  const now=Date.now()
  let list=users.map(u=>({...u,
    _d:loc&&u.latitude?calcDist(loc.lat,loc.lng,u.latitude,u.longitude):9999,
    _new:now-new Date(u.created_at||0).getTime()
  }))
  if(tab==='nearby') list.sort((a,b)=>a._d-b._d)
  else if(tab==='newcomers') list.sort((a,b)=>a._new-b._new)
  else list.sort((a,b)=>((b.is_featured?2:0)+(b.is_premium?1:0))-((a.is_featured?2:0)+(a.is_premium?1:0)))

  const filtered=list.filter(s=>
    s.id!==me
    &&(!searchQ||s.full_name?.toLowerCase().includes(searchQ.toLowerCase())||s.university?.toLowerCase().includes(searchQ.toLowerCase()))
    &&(gender==='All'||gender==='Auto'||s.gender===gender)
  )

  return(
    <div style={{maxWidth:480,margin:'0 auto',background:'#fafaf7',minHeight:'100vh',paddingBottom:80}}>

      {/* Match popup */}
      {matchPop&&(
        <div onClick={()=>setMatchPop(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:24,padding:'36px 24px',textAlign:'center',maxWidth:280,width:'100%'}}>
            <div style={{fontSize:52,marginBottom:8}}>💞</div>
            <h2 style={{fontSize:22,fontWeight:900,color:'#be185d',marginBottom:6}}>It's a Match!</h2>
            <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>You and <strong>{matchPop.name}</strong> liked each other!</p>
            <button onClick={()=>{setMatchPop(null);router.push(`/profile/${matchPop.id}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:12,padding:'12px 0',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              View Profile →
            </button>
          </div>
        </div>
      )}

      {/* Sticky top bar */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'#fafaf7',borderBottom:'1px solid #ece9df'}}>

        {/* Tabs row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 0'}}>
          <div style={{display:'flex',gap:0}}>
            {([['recommended','Recommend'],['newcomers','Newcomer'],['nearby','Nearby']] as const).map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                padding:'6px 14px',border:'none',background:'none',cursor:'pointer',
                fontSize:15,fontWeight:tab===t?900:500,
                color:tab===t?'#0f172a':'#aaa',
                borderBottom:tab===t?'2.5px solid #0f172a':'2.5px solid transparent',
              }}>{label}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>setSearchOpen(s=>!s)} style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid #e8ecf0',background:searchOpen?'#fff7ed':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#374151'}}>🔍</button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen&&(
          <div style={{padding:'8px 16px 12px'}}>
            <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search name or university..."
              style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:20,padding:'9px 16px',fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
        )}
      </div>

      {/* List */}
      <div>
        {loading
          ?[...Array(3)].map((_,i)=>(
            <div key={i} style={{background:'#fff',marginBottom:8,padding:16,display:'flex',gap:14}}>
              <div style={{width:76,height:76,borderRadius:'50%',background:'#f1f5f9',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{height:16,background:'#f1f5f9',borderRadius:6,marginBottom:10,width:'55%'}}/>
                <div style={{height:10,background:'#f1f5f9',borderRadius:6,width:'80%'}}/>
              </div>
            </div>
          ))
          :filtered.map(s=>{
            const distKm=loc&&s.latitude?calcDist(loc.lat,loc.lng,s.latitude,s.longitude):null
            const distLabel=distKm!==null?(distKm<0.1?'<0.1km':`${distKm.toFixed(1)}km`):null
            const isLiked=liked.has(s.id)
            const isMatch=matched.has(s.id)
            const online=isOnline(s.last_seen)
            const lastSeen=timeAgo(s.last_seen)
            const extras:string[]=Array.isArray(s.photos)?s.photos.filter((p:string)=>p&&p!==s.avatar_url).slice(0,4):[]
            const name=(s.full_name||'User').split(' ')[0]
            const said_hi=hiSent.has(s.id)

            return(
              <div key={s.id} onClick={()=>router.push(`/profile/${s.id}`)}
                style={{background:'#fff',marginBottom:8,padding:'16px 16px',cursor:'pointer',borderBottom:'1px solid #f5f5f0'}}>

                <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
                  {/* Avatar */}
                  <div style={{position:'relative',flexShrink:0}}>
                    <div style={{
                      width:76,height:76,borderRadius:'50%',overflow:'hidden',
                      border:s.is_featured?'3px solid #f97316':s.is_premium?'3px solid #f59e0b':'3px solid #e5e7eb',
                      boxShadow:s.is_premium?'0 0 0 2px #fef3c7':'none'
                    }}>
                      {s.avatar_url
                        ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                          background:`linear-gradient(135deg,${s.is_premium?'#7c3aed,#6d28d9':'#f97316,#ea580c'})`,
                          color:'#fff',fontSize:26,fontWeight:900}}>{initials(s.full_name)}</div>
                      }
                    </div>
                    {/* Online dot */}
                    <div style={{position:'absolute',bottom:3,right:3,width:13,height:13,borderRadius:'50%',
                      background:online?'#22c55e':'#d1d5db',border:'2.5px solid #fff'}}/>
                    {/* VIP badge below avatar */}
                    {s.is_premium&&(
                      <div style={{position:'absolute',bottom:-10,left:'50%',transform:'translateX(-50%)',
                        background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',
                        fontSize:8,padding:'2px 7px',borderRadius:4,fontWeight:900,whiteSpace:'nowrap',
                        border:'1.5px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}>VIP</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0,paddingTop:2}}>
                    {/* Name row */}
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                      <span style={{fontSize:17,fontWeight:800,color:'#0f172a'}}>{s.full_name||'User'}</span>
                      {s.is_verified&&<span style={{color:'#2563eb',fontSize:15}}>✓</span>}
                      {isMatch&&<span style={{fontSize:14}}>💞</span>}
                      {s.is_premium&&<span style={{fontSize:13}}>⭐</span>}
                    </div>

                    {/* Tag pills */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:s.university?5:0}}>
                      {distLabel&&(
                        <span style={{background:'#dcfce7',color:'#16a34a',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700,display:'flex',alignItems:'center',gap:2}}>
                          📍{distLabel}
                        </span>
                      )}
                      {s.age&&(
                        <span style={{background:'#fce7f3',color:'#be185d',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700}}>
                          ♀ {s.age}
                        </span>
                      )}
                      <span style={{background:'#f1f5f9',color:online?'#16a34a':'#64748b',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>
                        {lastSeen}
                      </span>
                      {s.looking_for&&(
                        <span style={{background:'#ede9fe',color:'#7c3aed',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>
                          {s.looking_for}
                        </span>
                      )}
                    </div>

                    {s.university&&(
                      <p style={{fontSize:12,color:'#94a3b8',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        🎓 {s.university}
                      </p>
                    )}
                  </div>

                  {/* Hi + Like buttons */}
                  <div onClick={e=>e.stopPropagation()} style={{flexShrink:0,display:'flex',flexDirection:'column',gap:8,alignItems:'center',paddingTop:2}}>
                    {/* Hi button */}
                    <button onClick={e=>sendHi(e,s.id,name)}
                      style={{
                        background:said_hi?'#f1f5f9':'linear-gradient(135deg,#f97316,#fb923c)',
                        color:said_hi?'#94a3b8':'#fff',
                        border:'none',borderRadius:20,padding:'7px 16px',
                        fontSize:14,fontWeight:800,cursor:said_hi?'default':'pointer',
                        display:'flex',alignItems:'center',gap:5,
                        boxShadow:said_hi?'none':'0 3px 12px rgba(249,115,22,0.45)',
                        minWidth:64,justifyContent:'center'
                      }}>
                      <span style={{fontSize:16}}>💬</span>
                      {said_hi?'Sent':'Hi'}
                    </button>
                    {/* Like */}
                    <button onClick={e=>like(e,s.id,name)}
                      style={{width:34,height:34,borderRadius:'50%',
                        border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e2e8f0'}`,
                        background:isMatch?'linear-gradient(135deg,#ec4899,#be185d)':isLiked?'#fdf2f8':'#fff',
                        cursor:isLiked?'default':'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:isMatch?'0 2px 8px rgba(236,72,153,0.4)':'none'}}>
                      <svg width="14" height="13" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#ccc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Photo strip */}
                {extras.length>0&&(
                  <div style={{marginTop:12,display:'grid',gridTemplateColumns:`repeat(${Math.min(extras.length,4)},1fr)`,gap:4}}>
                    {extras.map((p:string,i:number)=>(
                      <div key={i} style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'#f1f5f9'}}>
                        <img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" loading="lazy"/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        }
      </div>

      {!loading&&filtered.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px'}}>
          <div style={{fontSize:40,marginBottom:12}}>🔍</div>
          <p style={{fontSize:16,fontWeight:700,color:'#374151'}}>No one found</p>
          <p style={{fontSize:13,color:'#94a3b8',marginTop:4}}>Try a different tab</p>
        </div>
      )}
    </div>
  )
}
