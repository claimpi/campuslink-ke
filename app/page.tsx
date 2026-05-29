'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDistance(lat1:number,lon1:number,lat2:number,lon2:number):number{
  const R=6371
  const dLat=(lat2-lat1)*Math.PI/180
  const dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)))
}

export default function HomePage(){
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('All')
  const [lookingFor, setLookingFor] = useState('All')
  const [status, setStatus] = useState('All')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string|null>(null)
  const [friendStatuses, setFriendStatuses] = useState<Record<string,string>>({})
  const [sendingTo, setSendingTo] = useState<string|null>(null)
  const [userLocation, setUserLocation] = useState<{lat:number,lng:number}|null>(null)
  const [likes, setLikes] = useState<Set<string>>(new Set())
  const [matches, setMatches] = useState<Set<string>>(new Set())
  const [liking, setLiking] = useState<string|null>(null)
  const [showMatch, setShowMatch] = useState<string|null>(null)

  function loadFriendStatuses(userId:string){
    createClient().from('friend_requests').select('receiver_id,sender_id,status')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .not('status','eq','declined')
      .then(({data})=>{
        const s:Record<string,string>={}
        data?.forEach((r:any)=>{
          const other=r.sender_id===userId?r.receiver_id:r.sender_id
          if(r.status==='accepted') s[other]='friends'
          else if(r.sender_id===userId) s[other]='pending_sent'
          else s[other]='pending_received'
        })
        setFriendStatuses(s)
      })
  }

  function loadUsers(){
    createClient().from('profiles')
      .select('id,full_name,avatar_url,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,status,interests')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .then(({data,error})=>{ if(!error&&data) setUsers(data); setLoading(false) })
  }

  useEffect(()=>{
    createClient().from('announcements').select('*').order('created_at',{ascending:false}).limit(3)
      .then(({data})=>{ if(data&&data.length>0) setAnnouncements(data) })

    createClient().auth.getUser().then(({data:{user}})=>{
      if(user){
        setCurrentUserId(user.id)
        loadFriendStatuses(user.id)
        // Load likes sent
        createClient().from('likes').select('receiver_id').eq('sender_id',user.id)
          .then(({data})=>{ if(data) setLikes(new Set(data.map((l:any)=>l.receiver_id))) })
        // Load mutual matches
        createClient().from('likes').select('sender_id').eq('receiver_id',user.id)
          .then(({data:received})=>{
            if(!received) return
            const receivedIds=new Set(received.map((l:any)=>l.sender_id))
            createClient().from('likes').select('receiver_id').eq('sender_id',user.id)
              .then(({data:sent})=>{
                if(!sent) return
                const mutuals=new Set(sent.filter((l:any)=>receivedIds.has(l.receiver_id)).map((l:any)=>l.receiver_id))
                setMatches(mutuals)
              })
          })
      }
    })

    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}),
        ()=>{},{enableHighAccuracy:true,timeout:10000}
      )
    }

    loadUsers()
    const interval=setInterval(loadUsers,30000)
    return ()=>clearInterval(interval)
  },[])

  async function sendRequest(receiverId:string){
    if(!currentUserId){router.push('/login');return}
    setSendingTo(receiverId)
    const sb=createClient()
    await sb.from('friend_requests').insert([{sender_id:currentUserId,receiver_id:receiverId,status:'pending'}])
    setFriendStatuses(prev=>({...prev,[receiverId]:'pending_sent'}))
    setSendingTo(null)
    toast('Friend request sent!','success')
    loadFriendStatuses(currentUserId)
    const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUserId).maybeSingle()
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:receiverId,title:'New Friend Request',body:`${me?.full_name||'Someone'} wants to connect with you`,url:'/dashboard'})
    }).catch(()=>{})
  }

  async function handleLike(receiverId:string){
    if(!currentUserId){router.push('/login');return}
    if(likes.has(receiverId)) return
    setLiking(receiverId)
    setLikes(prev=>new Set([...prev,receiverId]))
    const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({senderId:currentUserId,receiverId})})
    const data=await res.json()
    if(data.isMatch){
      setMatches(prev=>new Set([...prev,receiverId]))
      setShowMatch(receiverId)
      setTimeout(()=>setShowMatch(null),4000)
    }
    setLiking(null)
  }

  const sorted=[...users].sort((a,b)=>{
    if(!userLocation||!a.latitude||!b.latitude) return 0
    return calcDistance(userLocation.lat,userLocation.lng,a.latitude,a.longitude)
          -calcDistance(userLocation.lat,userLocation.lng,b.latitude,b.longitude)
  })

  const filtered=sorted.filter(s=>{
    const q=search.toLowerCase()
    return(!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q))
      &&(gender==='All'||s.gender===gender)
      &&(lookingFor==='All'||s.looking_for===lookingFor)
      &&(status==='All'||s.status===status)
  })

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'16px'}}>

      {/* Match popup */}
      {showMatch&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={()=>setShowMatch(null)}>
          <div style={{background:'#fff',borderRadius:'24px',padding:'40px 32px',textAlign:'center',maxWidth:'300px',margin:'16px'}}>
            <div style={{fontSize:'60px',marginBottom:'12px'}}>&#9829;</div>
            <h2 style={{fontSize:'24px',fontWeight:'900',color:'#be185d',marginBottom:'8px'}}>Its a Match!</h2>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.5'}}>You both liked each other! Unlock their WhatsApp to connect.</p>
            <button onClick={()=>{setShowMatch(null);router.push(`/profile/${showMatch}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'14px',fontWeight:'700',cursor:'pointer',width:'100%'}}>
              Unlock WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* Announcements */}
      {announcements.map(a=>(
        <div key={a.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
          <div style={{flex:1}}>
            <span style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</span>
            {a.content&&<p style={{fontSize:'13px',color:'#64748b',marginTop:'2px'}}>{a.content}</p>}
          </div>
          <button onClick={()=>setAnnouncements(aa=>aa.filter(x=>x.id!==a.id))} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'16px'}}>x</button>
        </div>
      ))}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>People Nearby</h1>
          <p style={{fontSize:'13px',color:'#94a3b8'}}>{userLocation?'Sorted by distance · ':''}{filtered.length} people</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or location..."
          style={{flex:1,minWidth:'160px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'14px',outline:'none',background:'#fff'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={gender} onChange={e=>setGender(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">All</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
        </select>
        <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">Looking For</option>
          <option value="friendship">Friendship</option>
          <option value="relationship">Relationship</option>
          <option value="study">Study</option>
          <option value="networking">Networking</option>
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">Status</option>
          <option value="single">Single</option>
          <option value="taken">Taken</option>
        </select>
      </div>

      {/* Photo Grid */}
      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
          {[...Array(9)].map((_,i)=><div key={i} style={{aspectRatio:'3/4',borderRadius:'14px',background:'#f1f5f9'}}/>)}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
          {filtered.map(s=>{
            const dist=userLocation&&s.latitude&&s.longitude
              ?calcDistance(userLocation.lat,userLocation.lng,s.latitude,s.longitude):null
            const isLiked=likes.has(s.id)
            const isMatch=matches.has(s.id)
            return(
              <div key={s.id} onClick={()=>router.push(`/profile/${s.id}`)}
                style={{position:'relative',aspectRatio:'3/4',borderRadius:'14px',overflow:'hidden',cursor:'pointer',background:'#f1f5f9',
                  border:s.is_featured?'2px solid #f97316':'none'}}>
                {s.avatar_url
                  ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                    background:`linear-gradient(135deg,${s.is_premium?'#7c3aed':'#f97316'},${s.is_premium?'#6d28d9':'#ea580c'})`,
                    color:'#fff',fontSize:'28px',fontWeight:'900'}}>
                    {initials(s.full_name)}
                  </div>
                }



                {/* Top badges */}
                <div style={{position:'absolute',top:'6px',left:'6px',display:'flex',gap:'3px'}}>
                  {s.is_premium&&<span style={{background:'#7c3aed',color:'#fff',fontSize:'9px',padding:'2px 5px',borderRadius:'50px',fontWeight:'700'}}>PRO</span>}
                  {s.is_verified&&<span style={{background:'#2563eb',color:'#fff',fontSize:'9px',padding:'2px 5px',borderRadius:'50px',fontWeight:'700'}}>Verified</span>}
                </div>

                {/* Distance */}
                {dist!==null&&<div style={{position:'absolute',top:'6px',right:'6px',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px'}}>{dist}km</div>}

                {/* Bottom info - frosted glass */}
                <div style={{position:'absolute',bottom:'6px',left:'6px',right:'6px',display:'flex',alignItems:'center',justifyContent:'flex-end',gap:'4px'}}>

                  {/* Action buttons */}
                  {s.id!==currentUserId&&(
                    <div style={{display:'flex',gap:'3px',flexShrink:0}}>
                      <button onClick={e=>{e.stopPropagation();handleLike(s.id)}}
                        style={{width:'26px',height:'26px',borderRadius:'50%',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',
                          background:isMatch?'rgba(236,72,153,0.85)':isLiked?'rgba(236,72,153,0.6)':'rgba(255,255,255,0.18)',
                          backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',
                          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                          transition:'all 0.2s',transform:liking===s.id?'scale(1.2)':'scale(1)'}}>
                        <svg width="11" height="10" viewBox="0 0 24 21" fill={isLiked||isMatch?'#fff':'none'} stroke={isLiked||isMatch?'#fff':'rgba(255,255,255,0.9)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/>
                        </svg>
                      </button>
                      <button onClick={e=>{e.stopPropagation();
                        if(!friendStatuses[s.id]) sendRequest(s.id)
                        else if(friendStatuses[s.id]==='friends') router.push(`/profile/${s.id}`)
                        else if(friendStatuses[s.id]==='pending_received') router.push('/dashboard')
                      }} style={{height:'26px',borderRadius:'50px',border:'1px solid rgba(255,255,255,0.3)',cursor:'pointer',
                        padding:'0 8px',fontSize:'9px',fontWeight:'700',
                        backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',
                        background:friendStatuses[s.id]==='friends'?'rgba(22,163,74,0.75)':
                          friendStatuses[s.id]==='pending_sent'?'rgba(202,138,4,0.75)':
                          friendStatuses[s.id]==='pending_received'?'rgba(37,99,235,0.75)':'rgba(249,115,22,0.8)',
                        color:'#fff',whiteSpace:'nowrap'}}>
                        {sendingTo===s.id?'...':friendStatuses[s.id]==='friends'?'Friends':
                          friendStatuses[s.id]==='pending_sent'?'Pending':
                          friendStatuses[s.id]==='pending_received'?'Accept':'Connect'}
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
        <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No people found</p>
          <p style={{fontSize:'14px',color:'#94a3b8'}}>Try different filters</p>
        </div>
      )}
    </div>
  )
}
