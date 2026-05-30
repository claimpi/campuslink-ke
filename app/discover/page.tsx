'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)))
}
function lastActive(ts:string|null){
  if(!ts) return null
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  if(m<1) return{label:'Active now',color:'#22c55e'}
  if(m<60) return{label:`${m}m ago`,color:'#94a3b8'}
  const h=Math.floor(m/60)
  if(h<24) return{label:`${h}h ago`,color:'#94a3b8'}
  const d=Math.floor(h/24)
  return{label:`${d}d ago`,color:'#cbd5e1'}
}
function onlineStatus(ts:string|null){
  if(!ts) return 'offline'
  const m=Math.floor((Date.now()-new Date(ts).getTime())/60000)
  if(m<5) return 'online'
  if(m<30) return 'away'
  return 'offline'
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [gender,setGender]=useState('Auto')
  const [lookingFor,setLookingFor]=useState('All')
  const [tab,setTab]=useState<'nearby'|'newcomers'|'recommended'>('nearby')
  const [currentUserId,setCurrentUserId]=useState<string|null>(null)
  const [friendStatuses,setFriendStatuses]=useState<Record<string,string>>({})
  const [sendingTo,setSendingTo]=useState<string|null>(null)
  const [userLocation,setUserLocation]=useState<{lat:number,lng:number}|null>(null)
  const [likes,setLikes]=useState<Set<string>>(new Set())
  const [matches,setMatches]=useState<Set<string>>(new Set())
  const [liking,setLiking]=useState<string|null>(null)
  const [showMatch,setShowMatch]=useState<any>(null)

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      if(user){
        setCurrentUserId(user.id)
        sb.from('profiles').select('gender').eq('id',user.id).maybeSingle()
          .then(({data})=>{
            if(data?.gender==='male') setGender('female')
            else if(data?.gender==='female') setGender('male')
            else setGender('All')
          })
        sb.from('friend_requests').select('receiver_id,sender_id,status')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).not('status','eq','declined')
          .then(({data})=>{
            const s:Record<string,string>={}
            data?.forEach((r:any)=>{
              const o=r.sender_id===user.id?r.receiver_id:r.sender_id
              s[o]=r.status==='accepted'?'friends':r.sender_id===user.id?'pending_sent':'pending_received'
            })
            setFriendStatuses(s)
          })
        sb.from('likes').select('receiver_id').eq('sender_id',user.id)
          .then(({data})=>{ if(data) setLikes(new Set(data.map((l:any)=>l.receiver_id))) })
        sb.from('likes').select('sender_id').eq('receiver_id',user.id)
          .then(({data:recv})=>{
            if(!recv) return
            const rIds=new Set(recv.map((l:any)=>l.sender_id))
            sb.from('likes').select('receiver_id').eq('sender_id',user.id)
              .then(({data:sent})=>{
                if(sent) setMatches(new Set(sent.filter((l:any)=>rIds.has(l.receiver_id)).map((l:any)=>l.receiver_id)))
              })
          })
        // ping last_seen
        sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id).then(()=>{})
        const interval=setInterval(()=>{ sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id).then(()=>{}) },180000)
        return()=>clearInterval(interval)
      }
    })

    if(navigator.geolocation)
      navigator.geolocation.getCurrentPosition(p=>setUserLocation({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})

    sb.from('profiles')
      .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,status,last_seen,created_at')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
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
    const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUserId).maybeSingle()
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:receiverId,title:'New Friend Request',body:`${me?.full_name||'Someone'} wants to connect with you`,url:'/dashboard'})
    }).catch(()=>{})
  }

  async function handleLike(receiverId:string, userName:string){
    if(!currentUserId){router.push('/login');return}
    if(likes.has(receiverId)) return
    setLiking(receiverId)
    setLikes(p=>new Set([...p,receiverId]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:currentUserId,receiverId})})
    const data=await res.json()
    if(data.isMatch){
      setMatches(p=>new Set([...p,receiverId]))
      setShowMatch({id:receiverId,name:userName})
      setTimeout(()=>setShowMatch(null),5000)
    }
    setLiking(null)
  }

  // Sort by tab
  const now=Date.now()
  const withDist=users.map(u=>({
    ...u,
    _dist:userLocation&&u.latitude&&u.longitude?calcDist(userLocation.lat,userLocation.lng,u.latitude,u.longitude):9999,
    _age:now-new Date(u.created_at||0).getTime()
  }))

  let sorted=[...withDist]
  if(tab==='nearby') sorted.sort((a,b)=>a._dist-b._dist)
  else if(tab==='newcomers') sorted.sort((a,b)=>a._age-b._age)
  else sorted.sort((a,b)=>(b.is_featured?2:0)+(b.is_premium?1:0)-(a.is_featured?2:0)-(a.is_premium?1:0))

  const filtered=sorted.filter(s=>{
    const q=search.toLowerCase()
    return(!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q))
      &&(gender==='All'||gender==='Auto'||s.gender===gender)
      &&(lookingFor==='All'||s.looking_for===lookingFor)
      &&s.id!==currentUserId
  })

  const dotColor=(status:string)=>status==='online'?'#22c55e':status==='away'?'#f59e0b':'#d1d5db'

  return(
    <div style={{maxWidth:'520px',margin:'0 auto',padding:'0 0 80px'}}>

      {/* Match popup */}
      {showMatch&&(
        <div onClick={()=>setShowMatch(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'40px 28px',textAlign:'center',maxWidth:'300px',width:'100%'}}>
            <div style={{fontSize:'52px',marginBottom:'8px'}}>💞</div>
            <h2 style={{fontSize:'22px',fontWeight:'900',color:'#be185d',marginBottom:'6px'}}>It&apos;s a Match!</h2>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.5'}}>You and <strong>{showMatch.name}</strong> liked each other!</p>
            <button onClick={()=>{setShowMatch(null);router.push(`/profile/${showMatch.id}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:'700',cursor:'pointer',width:'100%'}}>
              View Profile
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:'20px 16px 12px'}}>
        <h1 style={{fontSize:'26px',fontWeight:'900',color:'#0f172a',marginBottom:'2px'}}>People Nearby</h1>
        <p style={{fontSize:'13px',color:'#94a3b8'}}>{filtered.length} people{userLocation?' · Sorted by distance':''}</p>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:'6px',padding:'0 16px',marginBottom:'14px'}}>
        {(['nearby','newcomers','recommended'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:'9px 4px',borderRadius:'50px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'600',
            background:tab===t?'#fff':' transparent',
            color:tab===t?'#f97316':'#94a3b8',
            boxShadow:tab===t?'0 2px 8px rgba(0,0,0,0.10)':'none',
            transition:'all 0.2s'
          }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',padding:'0 16px',marginBottom:'16px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
          style={{flex:1,minWidth:0,border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'14px',outline:'none',background:'#fff'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={gender} onChange={e=>setGender(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 10px',fontSize:'13px',outline:'none',background:'#fff',color:'#374151'}}>
          <option value="All">Everyone</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
        </select>
        <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 10px',fontSize:'13px',outline:'none',background:'#fff',color:'#374151'}}>
          <option value="All">Looking For</option>
          <option value="friendship">Friendship</option>
          <option value="relationship">Relationship</option>
          <option value="study">Study</option>
          <option value="networking">Networking</option>
        </select>
      </div>

      {/* Grid */}
      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px',padding:'0 16px'}}>
          {[...Array(6)].map((_,i)=><div key={i} style={{aspectRatio:'3/4.5',borderRadius:'16px',background:'linear-gradient(135deg,#f1f5f9,#e2e8f0)'}}/>)}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'10px',padding:'0 16px'}}>
          {filtered.map(s=>{
            const dist=userLocation&&s.latitude&&s.longitude?calcDist(userLocation.lat,userLocation.lng,s.latitude,s.longitude):null
            const distLabel=dist!==null?(dist<1?`${Math.round(dist*1000)}m`:`${dist.toFixed(1)}km`):null
            const isLiked=likes.has(s.id)
            const isMatch=matches.has(s.id)
            const online=onlineStatus(s.last_seen)
            const active=lastActive(s.last_seen)
            const extraPhotos:string[]=Array.isArray(s.photos)?s.photos.filter((p:string)=>p&&p!==s.avatar_url).slice(0,3):[]
            const firstName=s.full_name?.split(' ')[0]||'Unknown'
            return(
              <div key={s.id} style={{borderRadius:'18px',overflow:'hidden',background:'#fff',
                border:s.is_featured?'2px solid #f97316':'1.5px solid #e8ecf0',
                boxShadow:'0 2px 12px rgba(0,0,0,0.08)',display:'flex',flexDirection:'column'}}>

                {/* Photo */}
                <div style={{position:'relative',aspectRatio:'3/4',cursor:'pointer',background:'#f1f5f9',overflow:'hidden'}} onClick={()=>router.push(`/profile/${s.id}`)}>
                  {s.avatar_url
                    ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={firstName}/>
                    :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                        background:`linear-gradient(135deg,${s.is_premium?'#7c3aed':'#f97316'},${s.is_premium?'#6d28d9':'#ea580c'})`,
                        color:'#fff',fontSize:'32px',fontWeight:'900'}}>{initials(s.full_name)}</div>
                  }

                  {/* Gradient overlay bottom */}
                  <div style={{position:'absolute',bottom:0,left:0,right:0,height:'45%',background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)',pointerEvents:'none'}}/>

                  {/* Online dot */}
                  <div style={{position:'absolute',top:'8px',right:'8px',width:'12px',height:'12px',borderRadius:'50%',
                    background:dotColor(online),border:'2px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>

                  {/* Badges top-left */}
                  <div style={{position:'absolute',top:'8px',left:'8px',display:'flex',flexDirection:'column',gap:'3px'}}>
                    {s.is_premium&&<span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontSize:'8px',padding:'2px 5px',borderRadius:'4px',fontWeight:'800',letterSpacing:'0.3px'}}>VIP</span>}
                    {s.is_verified&&<span style={{background:'#2563eb',color:'#fff',fontSize:'8px',padding:'2px 5px',borderRadius:'4px',fontWeight:'700'}}>✓ Real</span>}
                  </div>

                  {/* Distance pill */}
                  {distLabel&&<div style={{position:'absolute',bottom:extraPhotos.length?'38px':'8px',left:'8px',
                    background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)',color:'#fff',fontSize:'10px',
                    padding:'2px 7px',borderRadius:'20px',fontWeight:'600'}}>
                    📍 {distLabel}
                  </div>}

                  {/* Photo strip */}
                  {extraPhotos.length>0&&(
                    <div style={{position:'absolute',bottom:'6px',left:'6px',right:'6px',display:'flex',gap:'3px'}}>
                      {extraPhotos.map((p:string,i:number)=>(
                        <div key={i} style={{flex:1,height:'30px',borderRadius:'5px',overflow:'hidden',border:'1.5px solid rgba(255,255,255,0.7)'}}>
                          <img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info row */}
                <div style={{padding:'8px 10px 10px',display:'flex',alignItems:'center',gap:'6px'}}>
                  <div style={{flex:1,minWidth:0,cursor:'pointer'}} onClick={()=>router.push(`/profile/${s.id}`)}>
                    <p style={{fontSize:'13px',fontWeight:'800',color:'#0f172a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:'1px'}}>
                      {firstName}{s.age?`, ${s.age}`:''}
                    </p>
                    {active&&(
                      <p style={{fontSize:'10px',color:active.color,fontWeight:'600'}}>{active.label}</p>
                    )}
                  </div>
                  {s.id!==currentUserId&&(
                    <div style={{display:'flex',gap:'4px',flexShrink:0}}>
                      {/* Like */}
                      <button onClick={e=>{e.stopPropagation();handleLike(s.id, s.full_name?.split(' ')[0]||'them')}}
                        style={{width:'32px',height:'32px',borderRadius:'50%',border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e2e8f0'}`,cursor:'pointer',
                          background:isMatch?'#ec4899':isLiked?'#fdf2f8':'#fff',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          transition:'all 0.2s',transform:liking===s.id?'scale(1.25)':'scale(1)',flexShrink:0}}>
                        <svg width="13" height="12" viewBox="0 0 24 21" fill={isLiked||isMatch?'#ec4899':'none'} stroke={isLiked||isMatch?'#ec4899':'#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/></svg>
                      </button>
                      {/* Connect */}
                      <button onClick={e=>{e.stopPropagation();
                        if(!friendStatuses[s.id]) sendRequest(s.id)
                        else if(friendStatuses[s.id]==='friends') router.push(`/profile/${s.id}`)
                        else if(friendStatuses[s.id]==='pending_received') router.push('/dashboard')
                      }} style={{height:'32px',borderRadius:'50px',border:'none',cursor:'pointer',padding:'0 10px',fontSize:'10px',fontWeight:'700',whiteSpace:'nowrap',flexShrink:0,
                        background:friendStatuses[s.id]==='friends'?'#16a34a':friendStatuses[s.id]==='pending_sent'?'#ca8a04':friendStatuses[s.id]==='pending_received'?'#2563eb':'#f97316',
                        color:'#fff',boxShadow:'0 2px 6px rgba(249,115,22,0.35)'}}>
                        {sendingTo===s.id?'...':friendStatuses[s.id]==='friends'?'Friends':friendStatuses[s.id]==='pending_sent'?'Pending':friendStatuses[s.id]==='pending_received'?'Accept':'Connect'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading&&filtered.length===0&&(
        <div style={{textAlign:'center',padding:'60px 20px',margin:'0 16px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>🔍</div>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No people found</p>
          <p style={{fontSize:'14px',color:'#94a3b8'}}>Try different filters</p>
        </div>
      )}
    </div>
  )
}
