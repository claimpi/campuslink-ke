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
function dotColor(ts:string|null){
  if(!ts) return '#d1d5db'
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  return m<5?'#22c55e':m<30?'#f59e0b':'#d1d5db'
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState(false)
  const [searchQ,setSearchQ]=useState('')
  const [gender,setGender]=useState('Auto')
  const [tab,setTab]=useState<'recommended'|'newcomers'|'nearby'>('recommended')
  const [me,setMe]=useState<string|null>(null)
  const [friendMap,setFriendMap]=useState<Record<string,string>>({})
  const [sending,setSending]=useState<string|null>(null)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [liked,setLiked]=useState<Set<string>>(new Set())
  const [matched,setMatched]=useState<Set<string>>(new Set())
  const [matchPop,setMatchPop]=useState<any>(null)
  const [hiSent,setHiSent]=useState<Set<string>>(new Set())

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
      .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,university,course,location_name,latitude,longitude,last_seen,created_at,interests')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .then(({data})=>{ if(data) setUsers(data); setLoading(false) })
  },[])

  async function sendHi(rid:string, name:string){
    if(!me){router.push('/login');return}
    if(hiSent.has(rid)) return
    setHiSent(p=>new Set([...p,rid]))
    toast(`👋 Hi sent to ${name}!`,'success')
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:rid,title:'Someone said Hi! 👋',body:`Someone nearby wants to connect with you`,url:'/dashboard'})
    }).catch(()=>{})
  }

  async function connect(rid:string){
    if(!me){router.push('/login');return}
    setSending(rid)
    const sb=createClient()
    await sb.from('friend_requests').insert([{sender_id:me,receiver_id:rid,status:'pending'}])
    setFriendMap(p=>({...p,[rid]:'pending_sent'}))
    setSending(null)
    toast('Request sent!','success')
  }

  async function like(rid:string,name:string){
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

  const filtered=list.filter(s=>{
    const q=searchQ.toLowerCase()
    return s.id!==me
      &&(!q||s.full_name?.toLowerCase().includes(q)||s.university?.toLowerCase().includes(q))
      &&(gender==='All'||gender==='Auto'||s.gender===gender)
  })

  return(
    <div style={{maxWidth:'480px',margin:'0 auto',background:'#f5f6fa',minHeight:'100vh',paddingBottom:80}}>

      {/* Match popup */}
      {matchPop&&(
        <div onClick={()=>setMatchPop(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:24,padding:'36px 24px',textAlign:'center',maxWidth:280,width:'100%'}}>
            <div style={{fontSize:48,marginBottom:8}}>💞</div>
            <h2 style={{fontSize:22,fontWeight:900,color:'#be185d',marginBottom:6}}>It's a Match!</h2>
            <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>You and <strong>{matchPop.name}</strong> liked each other!</p>
            <button onClick={()=>{setMatchPop(null);router.push(`/profile/${matchPop.id}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:12,padding:'12px 0',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              View Profile →
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{background:'#fff',padding:'14px 16px 0',position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 6px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          {/* Tabs */}
          <div style={{display:'flex',gap:0}}>
            {([['recommended','Recommend'],['newcomers','Newcomer'],['nearby','Nearby']] as const).map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                padding:'4px 12px',border:'none',background:'none',cursor:'pointer',
                fontSize:14,fontWeight:tab===t?800:500,
                color:tab===t?'#0f172a':'#94a3b8',
                borderBottom:tab===t?'2px solid #0f172a':'2px solid transparent',
                transition:'all 0.15s',whiteSpace:'nowrap'
              }}>{label}</button>
            ))}
          </div>
          {/* Search & filter icons */}
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>setSearch(s=>!s)} style={{width:34,height:34,borderRadius:'50%',border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🔍</button>
          </div>
        </div>

        {/* Search bar — slides in */}
        {search&&(
          <div style={{paddingBottom:10}}>
            <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search name or university..."
              style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:20,padding:'8px 16px',fontSize:14,outline:'none',background:'#f8fafc',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{padding:'8px 0'}}>
        {loading
          ?[...Array(4)].map((_,i)=>(
            <div key={i} style={{background:'#fff',margin:'0 0 8px',padding:16,display:'flex',gap:12,alignItems:'center'}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:'#f1f5f9',flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{height:14,background:'#f1f5f9',borderRadius:6,marginBottom:8,width:'60%'}}/>
                <div style={{height:10,background:'#f1f5f9',borderRadius:6,width:'80%'}}/>
              </div>
            </div>
          ))
          :filtered.map(s=>{
            const distKm=loc&&s.latitude?calcDist(loc.lat,loc.lng,s.latitude,s.longitude):null
            const distLabel=distKm!==null?(distKm<1?`<0.1km`:`${distKm.toFixed(1)}km`):null
            const isLiked=liked.has(s.id)
            const isMatch=matched.has(s.id)
            const active=timeAgo(s.last_seen)
            const onlineDot=dotColor(s.last_seen)
            const extras:string[]=Array.isArray(s.photos)?s.photos.filter((p:string)=>p&&p!==s.avatar_url).slice(0,4):[]
            const name=(s.full_name||'User').split(' ')[0]
            const fs=friendMap[s.id]
            const said_hi=hiSent.has(s.id)
            const interests:string[]=Array.isArray(s.interests)?s.interests.slice(0,3):[]

            return(
              <div key={s.id} style={{background:'#fff',marginBottom:8,padding:'14px 16px',cursor:'pointer'}}
                onClick={()=>router.push(`/profile/${s.id}`)}>

                {/* Row 1: avatar + info + Hi button */}
                <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:extras.length?12:0}}>
                  {/* Avatar */}
                  <div style={{position:'relative',flexShrink:0}}>
                    <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',border:s.is_featured?'2.5px solid #f97316':s.is_premium?'2.5px solid #f59e0b':'2px solid #e2e8f0'}}>
                      {s.avatar_url
                        ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                          background:`linear-gradient(135deg,${s.is_premium?'#7c3aed,#6d28d9':'#f97316,#ea580c'})`,
                          color:'#fff',fontSize:24,fontWeight:900}}>{initials(s.full_name)}</div>
                      }
                    </div>
                    {/* Online dot */}
                    <div style={{position:'absolute',bottom:2,right:2,width:12,height:12,borderRadius:'50%',
                      background:onlineDot,border:'2px solid #fff'}}/>
                    {/* VIP badge */}
                    {s.is_premium&&(
                      <div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',
                        background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',
                        fontSize:8,padding:'1px 5px',borderRadius:4,fontWeight:800,whiteSpace:'nowrap'}}>VIP</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                      <span style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{s.full_name||'User'}</span>
                      {s.is_verified&&<span style={{fontSize:14,color:'#2563eb'}}>✓</span>}
                      {isMatch&&<span style={{fontSize:12}}>💞</span>}
                    </div>

                    {/* Tags row */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:4}}>
                      {distLabel&&(
                        <span style={{display:'flex',alignItems:'center',gap:3,background:'#f0fdf4',color:'#16a34a',fontSize:11,padding:'2px 7px',borderRadius:20,fontWeight:600}}>
                          📍{distLabel}
                        </span>
                      )}
                      {s.age&&(
                        <span style={{background:'#fef3c7',color:'#92400e',fontSize:11,padding:'2px 7px',borderRadius:20,fontWeight:600}}>
                          ♀ {s.age}
                        </span>
                      )}
                      {active&&(
                        <span style={{background:'#f8fafc',color:active.color,fontSize:11,padding:'2px 7px',borderRadius:20,fontWeight:600}}>
                          {active.label}
                        </span>
                      )}
                      {s.looking_for&&(
                        <span style={{background:'#ede9fe',color:'#7c3aed',fontSize:11,padding:'2px 7px',borderRadius:20,fontWeight:600}}>
                          {s.looking_for}
                        </span>
                      )}
                    </div>

                    {s.university&&<p style={{fontSize:12,color:'#94a3b8',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🎓 {s.university}</p>}
                  </div>

                  {/* Hi button */}
                  <div onClick={e=>e.stopPropagation()} style={{flexShrink:0,display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
                    <button onClick={()=>sendHi(s.id,name)}
                      style={{background:said_hi?'#e2e8f0':'linear-gradient(135deg,#f97316,#ea580c)',
                        color:said_hi?'#94a3b8':'#fff',border:'none',borderRadius:20,
                        padding:'7px 14px',fontSize:13,fontWeight:700,cursor:said_hi?'default':'pointer',
                        display:'flex',alignItems:'center',gap:4,boxShadow:said_hi?'none':'0 3px 10px rgba(249,115,22,0.4)',
                        whiteSpace:'nowrap'}}>
                      <span style={{fontSize:15}}>👋</span> {said_hi?'Sent':'Hi'}
                    </button>
                    <button onClick={()=>{
                      if(isLiked||isMatch) return
                      like(s.id,name)
                    }} style={{width:32,height:32,borderRadius:'50%',border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e2e8f0'}`,
                      background:isMatch?'#ec4899':isLiked?'#fdf2f8':'#fff',cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width="13" height="12" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#bbb'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Photo strip */}
                {extras.length>0&&(
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(extras.length,4)},1fr)`,gap:4}}>
                    {extras.map((p:string,i:number)=>(
                      <div key={i} style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',background:'#f1f5f9'}}>
                        <img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="" loading="lazy"/>
                      </div>
                    ))}
                  </div>
                )}

                {/* Connect button — shown if not friends */}
                {me&&fs!=='friends'&&(
                  <div onClick={e=>e.stopPropagation()} style={{marginTop:10}}>
                    <button onClick={()=>{
                      if(!fs) connect(s.id)
                      else if(fs==='pending_received') router.push('/dashboard')
                    }} style={{width:'100%',height:36,borderRadius:20,border:'none',cursor:'pointer',
                      fontSize:13,fontWeight:700,
                      background:fs==='pending_sent'?'#f1f5f9':fs==='pending_received'?'#2563eb':'linear-gradient(135deg,#0f172a,#1e293b)',
                      color:fs==='pending_sent'?'#94a3b8':'#fff'}}>
                      {sending===s.id?'Sending...':fs==='pending_sent'?'Request Sent':fs==='pending_received'?'✓ Accept Request':'Connect'}
                    </button>
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
