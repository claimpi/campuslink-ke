'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  const d=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
  return d<1?`${Math.round(d*1000)}m`:`${Math.round(d)}km`
}
function onlineStatus(t:string|null):'online'|'recent'|'away'|'offline'{
  if(!t) return 'offline'
  const m=(Date.now()-new Date(t).getTime())/60000
  if(m<5) return 'online'
  if(m<60) return 'recent'
  if(m<1440) return 'away'
  return 'offline'
}
function lastActiveText(t:string|null){
  if(!t) return 'Never'
  const m=Math.floor((Date.now()-new Date(t).getTime())/60000)
  if(m<1) return 'Active now'
  if(m<60) return `${m}m ago`
  const h=Math.floor(m/60)
  if(h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function HomePage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [gender,setGender]=useState('Auto')
  const [lookingFor,setLookingFor]=useState('All')
  const [status,setStatus]=useState('All')
  const [tab,setTab]=useState<'nearby'|'newcomers'|'recommended'>('nearby')
  const [announcements,setAnnouncements]=useState<any[]>([])
  const [currentUserId,setCurrentUserId]=useState<string|null>(null)
  const [friendStatuses,setFriendStatuses]=useState<Record<string,string>>({})
  const [sendingTo,setSendingTo]=useState<string|null>(null)
  const [userLocation,setUserLocation]=useState<{lat:number,lng:number}|null>(null)
  const [likes,setLikes]=useState<Set<string>>(new Set())
  const [matches,setMatches]=useState<Set<string>>(new Set())
  const [liking,setLiking]=useState<string|null>(null)
  const [showMatch,setShowMatch]=useState<string|null>(null)

  function loadFriendStatuses(uid:string){
    createClient().from('friend_requests').select('receiver_id,sender_id,status')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`).not('status','eq','declined')
      .then(({data})=>{
        const s:Record<string,string>={}
        data?.forEach((r:any)=>{
          const o=r.sender_id===uid?r.receiver_id:r.sender_id
          s[o]=r.status==='accepted'?'friends':r.sender_id===uid?'pending_sent':'pending_received'
        })
        setFriendStatuses(s)
      })
  }

  useEffect(()=>{
    createClient().from('announcements').select('*').order('created_at',{ascending:false}).limit(3)
      .then(({data})=>{ if(data?.length) setAnnouncements(data) })

    createClient().auth.getUser().then(({data:{user}})=>{
      if(user){
        setCurrentUserId(user.id)
        loadFriendStatuses(user.id)
        // Ping last_seen every 3 minutes
        const ping=()=>fetch('/api/ping',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})}).catch(()=>{})
        ping()
        const pingInterval=setInterval(ping,3*60*1000)
        // Set opposite gender filter
        createClient().from('profiles').select('gender').eq('id',user.id).maybeSingle()
          .then(({data})=>{
            if(data?.gender==='male') setGender('female')
            else if(data?.gender==='female') setGender('male')
            else setGender('All')
          })
        createClient().from('likes').select('receiver_id').eq('sender_id',user.id)
          .then(({data})=>{ if(data) setLikes(new Set(data.map((l:any)=>l.receiver_id))) })
        createClient().from('likes').select('sender_id').eq('receiver_id',user.id)
          .then(({data:recv})=>{
            if(!recv) return
            const rIds=new Set(recv.map((l:any)=>l.sender_id))
            createClient().from('likes').select('receiver_id').eq('sender_id',user.id)
              .then(({data:sent})=>{
                if(sent) setMatches(new Set(sent.filter((l:any)=>rIds.has(l.receiver_id)).map((l:any)=>l.receiver_id)))
              })
          })
        return ()=>clearInterval(pingInterval)
      }
    })

    if(navigator.geolocation)
      navigator.geolocation.getCurrentPosition(p=>setUserLocation({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})

    createClient().from('profiles')
      .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,status,last_seen,created_at')
      .order('is_featured',{ascending:false})
      .then(({data})=>{ if(data) setUsers(data); setLoading(false) })
  },[])

  async function sendRequest(receiverId:string){
    if(!currentUserId){router.push('/login');return}
    setSendingTo(receiverId)
    const sb=createClient()
    await sb.from('friend_requests').insert([{sender_id:currentUserId,receiver_id:receiverId,status:'pending'}])
    setFriendStatuses(p=>({...p,[receiverId]:'pending_sent'}))
    setSendingTo(null)
    toast('Friend request sent!','success')
    loadFriendStatuses(currentUserId)
    const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUserId).maybeSingle()
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:receiverId,title:'New Friend Request',body:`${me?.full_name||'Someone'} wants to connect`,url:'/dashboard'})
    }).catch(()=>{})
  }

  async function handleLike(receiverId:string){
    if(!currentUserId){router.push('/login');return}
    if(likes.has(receiverId)) return
    setLiking(receiverId)
    setLikes(p=>new Set([...p,receiverId]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:currentUserId,receiverId})})
    const data=await res.json()
    if(data.isMatch){
      setMatches(p=>new Set([...p,receiverId]))
      setShowMatch(receiverId)
      setTimeout(()=>setShowMatch(null),4000)
    }
    setLiking(null)
  }

  // Sort & filter
  const now=Date.now()
  const withDist=users.map(u=>({
    ...u,
    dist:userLocation&&u.latitude&&u.longitude?calcDist(userLocation.lat,userLocation.lng,u.latitude,u.longitude):null,
    distNum:userLocation&&u.latitude&&u.longitude
      ?Math.sqrt((u.latitude-userLocation.lat)**2+(u.longitude-userLocation.lng)**2)
      :999999,
    isNew:(now-new Date(u.created_at).getTime())<7*24*60*60*1000
  }))

  const tabFiltered=withDist.filter(s=>{
    if(tab==='nearby') return s.distNum<999999||true
    if(tab==='newcomers') return s.isNew
    if(tab==='recommended') return s.is_premium||s.is_featured||s.is_verified
    return true
  })

  const sorted=tab==='newcomers'
    ?[...tabFiltered].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())
    :[...tabFiltered].sort((a,b)=>a.distNum-b.distNum)

  const filtered=sorted.filter(s=>{
    const q=search.toLowerCase()
    return s.id!==currentUserId
      &&(!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q))
      &&(gender==='All'||gender==='Auto'||s.gender===gender)
      &&(lookingFor==='All'||s.looking_for===lookingFor)
      &&(status==='All'||s.status===status)
  })

  const dotColor={'online':'#22c55e','recent':'#22c55e','away':'#f59e0b','offline':'#cbd5e1'}
  const tabs:[string,'nearby'|'newcomers'|'recommended'][]=[['Nearby','nearby'],['Newcomers','newcomers'],['Recommended','recommended']]

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'16px'}}>

      {showMatch&&(
        <div onClick={()=>setShowMatch(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'40px 32px',textAlign:'center',maxWidth:'300px',margin:'16px'}}>
            <div style={{fontSize:'56px',marginBottom:'12px',color:'#ec4899'}}>&#9829;</div>
            <h2 style={{fontSize:'24px',fontWeight:'900',color:'#be185d',marginBottom:'8px'}}>Its a Match!</h2>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.5'}}>You both liked each other! Unlock their WhatsApp to connect.</p>
            <button onClick={()=>{setShowMatch(null);router.push(`/profile/${showMatch}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:'700',cursor:'pointer',width:'100%'}}>
              Unlock WhatsApp
            </button>
          </div>
        </div>
      )}

      {announcements.map(a=>(
        <div key={a.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',gap:'10px'}}>
          <div style={{flex:1}}><p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</p>{a.content&&<p style={{fontSize:'13px',color:'#64748b',marginTop:'2px'}}>{a.content}</p>}</div>
          <button onClick={()=>setAnnouncements(aa=>aa.filter(x=>x.id!==a.id))} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer'}}>x</button>
        </div>
      ))}

      <div style={{marginBottom:'14px'}}>
        <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>People Nearby</h1>
        <p style={{fontSize:'13px',color:'#94a3b8'}}>{filtered.length} people</p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'6px',marginBottom:'14px',background:'#f1f5f9',borderRadius:'12px',padding:'4px'}}>
        {tabs.map(([label,value])=>(
          <button key={value} onClick={()=>setTab(value)}
            style={{flex:1,padding:'8px',borderRadius:'9px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'700',transition:'all 0.2s',
              background:tab===value?'#fff':'transparent',
              color:tab===value?'#f97316':'#64748b',
              boxShadow:tab===value?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
          style={{flex:1,minWidth:'120px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',outline:'none',background:'#fff'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={gender} onChange={e=>setGender(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 10px',fontSize:'12px',outline:'none',background:'#fff'}}>
          <option value="All">Everyone</option><option value="male">Men</option><option value="female">Women</option>
        </select>
        <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 10px',fontSize:'12px',outline:'none',background:'#fff'}}>
          <option value="All">Looking For</option><option value="friendship">Friends</option><option value="relationship">Relationship</option><option value="study">Study</option>
        </select>
      </div>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
          {[...Array(9)].map((_,i)=><div key={i} style={{aspectRatio:'3/4',borderRadius:'14px',background:'#f1f5f9'}}/>)}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
          {filtered.map(s=>{
            const isLiked=likes.has(s.id)
            const isMatch=matches.has(s.id)
            const online=onlineStatus(s.last_seen)
            const photos=Array.isArray(s.photos)?s.photos.filter(Boolean).slice(0,4):[]
            const vipBadge=s.is_premium?'VIP':null
            return(
              <div key={s.id} style={{borderRadius:'12px',overflow:'hidden',border:s.is_featured?'2px solid #f97316':'1px solid #e2e8f0',background:'#fff',display:'flex',flexDirection:'column',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                {/* Main photo */}
                <div style={{position:'relative',aspectRatio:'3/4',cursor:'pointer',background:'#f1f5f9'}} onClick={()=>router.push(`/profile/${s.id}`)}>
                  {s.avatar_url
                    ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,#f97316,#ea580c)`,color:'#fff',fontSize:'26px',fontWeight:'900'}}>{initials(s.full_name)}</div>
                  }
                  {/* Online dot */}
                  {online!=='offline'&&(
                    <div style={{position:'absolute',top:'7px',right:'7px',width:'10px',height:'10px',borderRadius:'50%',background:dotColor[online],border:'2px solid #fff',boxShadow:'0 0 4px rgba(0,0,0,0.2)'}}/>
                  )}
                  {/* Badges top left */}
                  <div style={{position:'absolute',top:'6px',left:'6px',display:'flex',gap:'3px',flexDirection:'column'}}>
                    {vipBadge&&<span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontSize:'8px',padding:'2px 5px',borderRadius:'4px',fontWeight:'800'}}>VIP</span>}
                    {s.is_verified&&<span style={{background:'#2563eb',color:'#fff',fontSize:'8px',padding:'2px 5px',borderRadius:'4px',fontWeight:'700'}}>Verified</span>}
                  </div>
                  {/* Distance pill */}
                  {s.dist&&<div style={{position:'absolute',bottom:'7px',left:'7px',background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px',fontWeight:'600'}}>{s.dist}</div>}
                </div>
                {/* Mini photo strip */}
                {photos.length>0&&(
                  <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(photos.length,4)},1fr)`,gap:'1px',height:'32px',background:'#f1f5f9'}}>
                    {photos.slice(0,4).map((p:string,i:number)=>(
                      <img key={i} src={p} style={{width:'100%',height:'100%',objectFit:'cover',cursor:'pointer'}} onClick={()=>router.push(`/profile/${s.id}`)}/>
                    ))}
                  </div>
                )}
                {/* Action bar */}
                <div style={{background:'#fff',padding:'6px 7px',display:'flex',alignItems:'center',gap:'5px',borderTop:'1px solid #f1f5f9'}}>
                  <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>router.push(`/profile/${s.id}`)}>
                    <p style={{fontSize:'11px',fontWeight:'700',color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.full_name?.split(' ')[0]}{s.age?`, ${s.age}`:''}</p>
                    <p style={{fontSize:'9px',color:online==='online'?'#22c55e':online==='recent'?'#22c55e':'#94a3b8',fontWeight:online!=='offline'?'600':'400'}}>{lastActiveText(s.last_seen)}</p>
                  </div>
                  <div style={{display:'flex',gap:'3px',flexShrink:0}}>
                    <button onClick={e=>{e.stopPropagation();handleLike(s.id)}}
                      style={{width:'26px',height:'26px',borderRadius:'50%',border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e2e8f0'}`,cursor:'pointer',
                        background:isMatch?'#ec4899':isLiked?'#fdf2f8':'#fff',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        transition:'all 0.2s',transform:liking===s.id?'scale(1.2)':'scale(1)'}}>
                      <svg width="11" height="10" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/></svg>
                    </button>
                    <button onClick={e=>{e.stopPropagation();
                      if(!friendStatuses[s.id]) sendRequest(s.id)
                      else if(friendStatuses[s.id]==='friends') router.push(`/profile/${s.id}`)
                      else if(friendStatuses[s.id]==='pending_received') router.push('/dashboard')
                    }} style={{height:'26px',borderRadius:'50px',border:'none',cursor:'pointer',padding:'0 7px',fontSize:'9px',fontWeight:'700',whiteSpace:'nowrap',
                      background:friendStatuses[s.id]==='friends'?'#16a34a':friendStatuses[s.id]==='pending_sent'?'#ca8a04':friendStatuses[s.id]==='pending_received'?'#2563eb':'#f97316',
                      color:'#fff'}}>
                      {sendingTo===s.id?'...':friendStatuses[s.id]==='friends'?'Friends':friendStatuses[s.id]==='pending_sent'?'Pending':friendStatuses[s.id]==='pending_received'?'Accept':'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading&&filtered.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No people found</p>
          <p style={{fontSize:'14px',color:'#94a3b8'}}>Try different filters</p>
        </div>
      )}
    </div>
  )
}
