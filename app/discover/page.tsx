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

export default function DiscoverPage(){
  const router = useRouter()
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState('All')
  const [lookingFor, setLookingFor] = useState('All')
  const [status, setStatus] = useState('All')
  const [currentUserId, setCurrentUserId] = useState<string|null>(null)
  const [friendStatuses, setFriendStatuses] = useState<Record<string,string>>({})
  const [sendingTo, setSendingTo] = useState<string|null>(null)
  const [userLocation, setUserLocation] = useState<{lat:number,lng:number}|null>(null)

  useEffect(()=>{
    createClient().auth.getUser().then(({data:{user}})=>{
      if(user){
        setCurrentUserId(user.id)
        createClient().from('friend_requests').select('receiver_id,sender_id,status')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .not('status','eq','declined')
          .then(({data})=>{
            const s:Record<string,string>={}
            data?.forEach((r:any)=>{
              const other=r.sender_id===user.id?r.receiver_id:r.sender_id
              if(r.status==='accepted') s[other]='friends'
              else if(r.sender_id===user.id) s[other]='pending_sent'
              else s[other]='pending_received'
            })
            setFriendStatuses(s)
          })
      }
    })
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>setUserLocation({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})
    createClient().from('profiles')
      .select('id,full_name,avatar_url,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,status')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .then(({data})=>{ if(data) setPeople(data); setLoading(false) })
  },[])

  async function sendRequest(receiverId:string){
    if(!currentUserId){router.push('/login');return}
    setSendingTo(receiverId)
    const sb=createClient()
    await sb.from('friend_requests').insert([{sender_id:currentUserId,receiver_id:receiverId,status:'pending'}])
    setFriendStatuses(prev=>({...prev,[receiverId]:'pending_sent'}))
    setSendingTo(null)
    toast('Friend request sent!','success')
    const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUserId).maybeSingle()
    fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:receiverId,title:'New Friend Request',body:`${me?.full_name||'Someone'} wants to connect with you`,url:'/dashboard'})
    }).catch(()=>{})
  }

  const sorted=[...people].sort((a,b)=>{
    if(!userLocation||!a.latitude||!b.latitude) return 0
    return calcDistance(userLocation.lat,userLocation.lng,a.latitude,a.longitude)-calcDistance(userLocation.lat,userLocation.lng,b.latitude,b.longitude)
  })

  const filtered=sorted.filter(s=>{
    const q=search.toLowerCase()
    return(!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q))
      &&(gender==='All'||s.gender===gender)
      &&(lookingFor==='All'||s.looking_for===lookingFor)
      &&(status==='All'||s.status===status)
  })

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'24px 16px'}}>
      <div style={{marginBottom:'20px'}}>
        <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Discover People</h1>
        <p style={{fontSize:'13px',color:'#94a3b8'}}>{filtered.length} people · {userLocation?'sorted by distance':''}</p>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or location..."
          style={{flex:1,minWidth:'160px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 14px',fontSize:'14px',outline:'none',background:'#fff'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={gender} onChange={e=>setGender(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">All Genders</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
        </select>
        <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">Looking For</option>
          <option value="friendship">Friendship</option>
          <option value="relationship">Relationship</option>
          <option value="study">Study Partner</option>
          <option value="networking">Networking</option>
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
          <option value="All">All Status</option>
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'10px'}}>
          {filtered.map(s=>{
            const dist=userLocation&&s.latitude&&s.longitude?calcDistance(userLocation.lat,userLocation.lng,s.latitude,s.longitude):null
            return(
              <div key={s.id} onClick={()=>router.push(`/profile/${s.id}`)}
                style={{position:'relative',aspectRatio:'3/4',borderRadius:'14px',overflow:'hidden',cursor:'pointer',background:'#f1f5f9',
                  border:s.is_featured?'2px solid #f97316':'none'}}>
                {s.avatar_url
                  ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,#f97316,#ea580c)`,color:'#fff',fontSize:'32px',fontWeight:'900'}}>{initials(s.full_name)}</div>
                }
                <div style={{position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)'}}/>
                {s.is_premium&&<div style={{position:'absolute',top:'8px',left:'8px',background:'#7c3aed',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px',fontWeight:'700'}}>PRO</div>}
                {s.is_verified&&<div style={{position:'absolute',top:'8px',right:'8px',background:'#2563eb',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px',fontWeight:'700'}}>Verified</div>}
                {dist!==null&&<div style={{position:'absolute',top:s.is_premium?'28px':'8px',right:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px'}}>{dist}km</div>}
                <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px'}}>
                  <p style={{color:'#fff',fontWeight:'700',fontSize:'14px',marginBottom:'2px'}}>{s.full_name?.split(' ')[0]}{s.age?`, ${s.age}`:''}</p>
                  {s.location_name&&<p style={{color:'rgba(255,255,255,0.75)',fontSize:'10px',marginBottom:'6px'}}>{s.location_name}</p>}
                  {s.id!==currentUserId&&(
                    <button onClick={e=>{e.stopPropagation();
                      if(!friendStatuses[s.id]) sendRequest(s.id)
                      else if(friendStatuses[s.id]==='friends') router.push(`/profile/${s.id}`)
                      else if(friendStatuses[s.id]==='pending_received') router.push('/dashboard')
                    }} style={{width:'100%',padding:'6px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'700',
                      background:friendStatuses[s.id]==='friends'?'rgba(22,163,74,0.9)':friendStatuses[s.id]==='pending_sent'?'rgba(202,138,4,0.9)':friendStatuses[s.id]==='pending_received'?'rgba(37,99,235,0.9)':'rgba(249,115,22,0.95)',
                      color:'#fff'}}>
                      {sendingTo===s.id?'...':friendStatuses[s.id]==='friends'?'Friends':friendStatuses[s.id]==='pending_sent'?'Pending':friendStatuses[s.id]==='pending_received'?'Accept':'Connect'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
