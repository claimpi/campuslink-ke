'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'

function initials(n:string){return(n||'?').split('').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

function calcDistance(lat1:number,lon1:number,lat2:number,lon2:number):number{
 const R=6371
 const dLat=(lat2-lat1)*Math.PI/180
 const dLon=(lon2-lon1)*Math.PI/180
 const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
 return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)))
}

export default function HomePage(){
 const router=useRouter()
 const [students,setStudents]=useState<any[]>([])
 const [loading,setLoading]=useState(true)
 const [search,setSearch]=useState('')
 const [gender,setGender]=useState('All')
 const [lookingFor,setLookingFor]=useState('All')
 const [status,setStatus]=useState('All')
 const [announcements,setAnnouncements]=useState<any[]>([])
 const [currentUserId,setCurrentUserId]=useState<string|null>(null)
 const [friendStatuses,setFriendStatuses]=useState<Record<string,string>>({})
 const [sendingTo,setSendingTo]=useState<string|null>(null)
 const [userLocation,setUserLocation]=useState<{lat:number,lng:number}|null>(null)
 const [locating,setLocating]=useState(false)

 const loadFriendStatuses=(userId:string)=>{
 createClient().from('friend_requests').select('receiver_id,sender_id,status')
 .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
 .not('status','eq','declined')
 .then(({data})=>{
 const statuses:Record<string,string>={}
 data?.forEach((r:any)=>{
 const otherId=r.sender_id===userId?r.receiver_id:r.sender_id
 if(r.status==='accepted') statuses[otherId]='friends'
 else if(r.sender_id===userId) statuses[otherId]='pending_sent'
 else statuses[otherId]='pending_received'
 })
 setFriendStatuses(statuses)
 })
 }

 const loadStudents=()=>{
 createClient().from('profiles')
 .select('id,full_name,avatar_url,is_premium,is_featured,is_top_student,interests,status,age,gender,looking_for,location_name,latitude,longitude')
 .order('is_featured',{ascending:false})
 .order('is_premium',{ascending:false})
 .then(({data,error})=>{ if(!error&&data&&data.length>0) setStudents(data); setLoading(false) })
 }

 useEffect(()=>{
 createClient().from('announcements').select('*').order('created_at',{ascending:false}).limit(3)
 .then(({data})=>{ if(data&&data.length>0) setAnnouncements(data) })

 createClient().auth.getUser().then(({data:{user}})=>{
 if(user){ setCurrentUserId(user.id); loadFriendStatuses(user.id) }
 })

 // Get live GPS location
 if(navigator.geolocation){
 setLocating(true)
 navigator.geolocation.getCurrentPosition(
 pos=>{ setUserLocation({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLocating(false) },
 ()=>setLocating(false),
 {enableHighAccuracy:true,timeout:10000}
 )
 }

 loadStudents()
 const interval=setInterval(loadStudents,30000)
 return ()=>clearInterval(interval)
 },[])

 async function sendRequest(receiverId:string){
 if(!currentUserId){router.push('/login');return}
 setSendingTo(receiverId)
 const sb=createClient()
 await sb.from('friend_requests').insert([{sender_id:currentUserId,receiver_id:receiverId,status:'pending'}])
 setFriendStatuses(prev=>({...prev,[receiverId]:'pending_sent'}))
 setSendingTo(null)
 toast('Friend request sent! ','success','')
 loadFriendStatuses(currentUserId)
 const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUserId).maybeSingle()
 fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({userId:receiverId,title:'New Friend Request ',body:`${me?.full_name||'Someone'} wants to connect with you on CampusLink KE`,url:'/dashboard'})
 }).then(r=>r.json()).then(d=>console.log('Push sent:',d)).catch(e=>console.error('Push failed:',e))
 }

 // Sort by distance if location available
 const sorted = [...students].sort((a,b)=>{
 if(!userLocation||!a.latitude||!b.latitude) return 0
 const da=calcDistance(userLocation.lat,userLocation.lng,a.latitude,a.longitude)
 const db=calcDistance(userLocation.lat,userLocation.lng,b.latitude,b.longitude)
 return da-db
 })

 const filtered=sorted.filter(s=>{
 const q=search.toLowerCase()
 const matchSearch=!q||s.full_name?.toLowerCase().includes(q)||s.location_name?.toLowerCase().includes(q)
    const matchGender=gender==='All'||s.gender===gender
 const matchLooking=lookingFor==='All'||s.looking_for===lookingFor
 const matchStatus=status==='All'||s.status===status
 return matchSearch&&matchGender&&matchLooking&&matchStatus
 })

 return(
 <div style={{maxWidth:'900px',margin:'0 auto',padding:'16px'}}>

 {/* Announcements */}
 {announcements.map(a=>(
 <div key={a.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
 <span style={{fontSize:'16px',flexShrink:0}}></span>
 <div style={{flex:1}}><span style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</span>
 {a.content&&<p style={{fontSize:'13px',color:'#64748b',marginTop:'2px'}}>{a.content}</p>}
 </div>
 <button onClick={()=>setAnnouncements(aa=>aa.filter(x=>x.id!==a.id))} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'16px'}}></button>
 </div>
 ))}

 {/* Header */}
 <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
 <div>
 <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>
 'People Nearby'
 {locating&&<span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'400',marginLeft:'8px'}}> Getting location...</span>}
 </h1>
 <p style={{fontSize:'13px',color:'#94a3b8'}}>
 {userLocation?`Sorted by distance from you · `:''}
 {filtered.length} students
 </p>
 </div>
 {!currentUserId&&(
 <div style={{display:'flex',gap:'8px'}}>
 <Link href="/login" style={{color:'#64748b',padding:'8px 14px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',border:'1px solid #e2e8f0',background:'#fff'}}>Sign In</Link>
 <Link href="/register" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'8px 16px',borderRadius:'8px',fontWeight:'600',fontSize:'13px'}}>Join Free</Link>
 </div>
 )}
 </div>

 {/* Filters */}
 <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'}}>
 <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, course..."
 style={{flex:1,minWidth:'160px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 12px',fontSize:'14px',outline:'none',background:'#fff'}}
 onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
 <select value={gender} onChange={e=>setGender(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
 <option value="All">All</option>
 <option value="male"> Men</option>
 <option value="female"> Women</option>
 </select>
 <select value={lookingFor} onChange={e=>setLookingFor(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
 <option value="All">Looking For</option>
 <option value="friendship"> Friends</option>
 <option value="relationship"> Relationship</option>
 <option value="study"> Study</option>
 <option value="networking"> Network</option>
 </select>
 <select value={status} onChange={e=>setStatus(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'8px 10px',fontSize:'13px',outline:'none',background:'#fff',cursor:'pointer'}}>
 <option value="All">All Status</option>
 <option value="single"> Single</option>
 <option value="taken"> Taken</option>
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
 ?calcDistance(userLocation.lat,userLocation.lng,s.latitude,s.longitude)
 :null

 return(
 <div key={s.id} onClick={()=>router.push(`/profile/${s.id}`)}
 style={{position:'relative',aspectRatio:'3/4',borderRadius:'14px',overflow:'hidden',cursor:'pointer',background:'#f1f5f9',
 border:s.is_featured?'2px solid #f97316':s.is_top_student?'2px solid #f97316':'none'}}>

 {/* Photo */}
 {s.avatar_url
 ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
 :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${s.is_premium?'#7c3aed':'#f97316'},${s.is_premium?'#6d28d9':'#ea580c'})`,color:'#fff',fontSize:'32px',fontWeight:'900'}}>
 {initials(s.full_name)}
 </div>
 }

 {/* Gradient overlay */}
 <div style={{position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)'}}/>

 {/* Badges top */}
 <div style={{position:'absolute',top:'8px',left:'8px',display:'flex',gap:'4px',flexWrap:'wrap'}}>
 {s.is_premium&&<span style={{background:'#7c3aed',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px',fontWeight:'700'}}>PRO</span>}
 {s.is_top_student&&<span style={{background:'#f97316',color:'#fff',fontSize:'9px',padding:'2px 6px',borderRadius:'50px',fontWeight:'700'}}>TOP</span>}
 </div>

 {/* Distance top right */}
 {dist!==null&&<div style={{position:'absolute',top:'8px',right:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:'10px',padding:'3px 7px',borderRadius:'50px',fontWeight:'600'}}>{dist}km</div>}

 {/* Info bottom */}
 <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'10px 10px 8px'}}>
 <p style={{color:'#fff',fontWeight:'700',fontSize:'14px',lineHeight:'1.2',marginBottom:'3px',textShadow:'0 1px 3px rgba(0,0,0,0.5)'}}>
 {s.full_name?.split('')[0]}{s.age?`, ${s.age}`:''}
 </p>
 {s.location_name&&<p style={{color:'rgba(255,255,255,0.8)',fontSize:'10px',marginBottom:'4px'}}> {s.location_name}</p>}
 {s.looking_for&&<p style={{color:'rgba(255,255,255,0.7)',fontSize:'10px',marginBottom:'6px'}}>
 {s.looking_for==='friendship'?' Friends':s.looking_for==='relationship'?' Relationship':s.looking_for==='study'?' Study':' Network'}
 </p>}

 {/* Connect button */}
 {s.id!==currentUserId&&(
 <button onClick={e=>{e.stopPropagation();
 if(friendStatuses[s.id]==='none'||!friendStatuses[s.id]) sendRequest(s.id)
 else if(friendStatuses[s.id]==='friends') router.push(`/profile/${s.id}`)
 else if(friendStatuses[s.id]==='pending_received') router.push('/dashboard')
 }}
 style={{width:'100%',padding:'6px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'700',
 background:friendStatuses[s.id]==='friends'?'rgba(22,163,74,0.9)':
 friendStatuses[s.id]==='pending_sent'?'rgba(202,138,4,0.9)':
 friendStatuses[s.id]==='pending_received'?'rgba(37,99,235,0.9)':
 'rgba(249,115,22,0.95)',
 color:'#fff',backdropFilter:'blur(4px)'}}>
 {sendingTo===s.id?'...':
 friendStatuses[s.id]==='friends'?' Friends':
 friendStatuses[s.id]==='pending_sent'?' Pending':
 friendStatuses[s.id]==='pending_received'?'Accept':
 'Connect'}
 </button>
 )}
 </div>
 </div>
 )
 })}
 </div>
 )}

 {!loading&&filtered.length===0&&(
 <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
 <p style={{fontSize:'32px',marginBottom:'12px'}}></p>
 <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No students found</p>
 <p style={{fontSize:'14px',color:'#94a3b8'}}>Try different filters</p>
 </div>
 )}

 <style>{`@media(max-width:480px){}`}</style>
 </div>
 )
}
