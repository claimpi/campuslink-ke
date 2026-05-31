'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { toast } from '@/components/Toast'
import Stories from '@/components/ui/Stories'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
function isOnline(ts:string|null){
  if(!ts) return false
  return (Date.now()-new Date(ts).getTime())/60000<5
}

export default function DiscoverPage(){
  const router=useRouter()
  const [users,setUsers]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [searchOpen,setSearchOpen]=useState(false)
  const [searchQ,setSearchQ]=useState('')
  const [gender,setGender]=useState('All')
  const [tab,setTab]=useState<'recommended'|'newcomers'|'nearby'>('recommended')
  const [me,setMe]=useState<string|null>(null)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [liked,setLiked]=useState<Set<string>>(new Set())
  const [matched,setMatched]=useState<Set<string>>(new Set())
  const [matchPop,setMatchPop]=useState<any>(null)
  const [superLiked,setSuperLiked]=useState<Set<string>>(new Set())
  const [dailyReward,setDailyReward]=useState<{coins:number,streak:number}|null>(null)

  useEffect(()=>{
    const sb=createClient()
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(async p=>{
      setLoc({lat:p.coords.latitude,lng:p.coords.longitude})
      // Auto-save location to profile silently
      const sb2=createClient()
      const {data:{user:u}}=await sb2.auth.getUser()
      if(u){
        // Only update if coords changed significantly
        const {data:prof}=await sb2.from('profiles').select('latitude,longitude').eq('id',u.id).maybeSingle()
        const same=prof?.latitude&&Math.abs(prof.latitude-p.coords.latitude)<0.01&&Math.abs(prof.longitude-p.coords.longitude)<0.01
        if(!same){
          // Reverse geocode
          try{
            const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`)
            const geo=await res.json()
            const town=geo.address?.suburb||geo.address?.city||geo.address?.town||geo.address?.county||'Kenya'
            await sb2.from('profiles').update({latitude:p.coords.latitude,longitude:p.coords.longitude,location_name:town}).eq('id',u.id)
          }catch{
            await sb2.from('profiles').update({latitude:p.coords.latitude,longitude:p.coords.longitude}).eq('id',u.id)
          }
        }
      }
    },()=>{})

    sb.auth.getUser().then(({data:{user}})=>{
      if(!user){
        // Not logged in — show all profiles, actions locked
        sb.from('profiles')
          .select('id,full_name,avatar_url,photos,is_premium,is_featured,age,gender,looking_for,location_name,latitude,longitude,last_seen,created_at')
          .order('is_featured',{ascending:false}).order('last_seen',{ascending:false,nullsFirst:false})
          .limit(80).then(({data})=>{ if(data) setUsers(data); setLoading(false) })
        return
      }
      setMe(user.id)
      // Get my gender → show opposite
      sb.from('profiles').select('gender').eq('id',user.id).maybeSingle().then(({data})=>{
        // Show everyone for now until we gain traffic
        setGender('All')

        let q=sb.from('profiles')
          .select('id,full_name,avatar_url,photos,is_premium,is_featured,is_verified,age,gender,looking_for,location_name,latitude,longitude,last_seen,created_at')
          .neq('id',user.id)
          .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
          .order('last_seen',{ascending:false,nullsFirst:false}).limit(80)

        q.then(({data:users})=>{ if(users) setUsers(users); setLoading(false) })
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
      // Load super likes sent
      sb.from('super_likes').select('receiver_id').eq('sender_id',user.id)
        .then(({data})=>{ if(data) setSuperLiked(new Set(data.map((l:any)=>l.receiver_id))) })
      // Claim daily reward
      fetch('/api/daily-reward',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})})
        .then(r=>r.json()).then(data=>{
          if(data.success) setDailyReward({coins:data.coins,streak:data.streak})
        })
      sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
      const t=setInterval(()=>sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id),180000)
      return()=>clearInterval(t)
    })
  },[])

  async function like(e:React.MouseEvent, rid:string, name:string){
    e.stopPropagation()
    if(!me){router.push('/register');return}
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

  async function superLike(e:React.MouseEvent, rid:string, name:string){
    e.stopPropagation()
    if(!me){router.push('/register');return}
    if(superLiked.has(rid)) return
    setSuperLiked(p=>new Set([...p,rid]))
    const res=await fetch('/api/super-like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me,receiverId:rid})})
    const data=await res.json()
    if(data.error==='insufficient_coins'){
      setSuperLiked(p=>{ const n=new Set(p); n.delete(rid); return n })
      toast(`Need 10 coins to Super Like. You have ${data.coinsHave}.`,'error')
      setTimeout(()=>router.push('/pricing'),1500)
    } else if(data.success){
      toast(`⭐ Super Like sent to ${name}!`,'success')
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
    &&(!searchQ||s.full_name?.toLowerCase().includes(searchQ.toLowerCase())||s.location_name?.toLowerCase().includes(searchQ.toLowerCase()))
    &&(gender==='All'||s.gender===gender)
  )

  return(
    <div style={{maxWidth:480,margin:'0 auto',background:'#f5f6fa',minHeight:'100vh',paddingBottom:80}}>

      {/* Match popup */}
      {matchPop&&(
        <div onClick={()=>setMatchPop(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:24,padding:'36px 24px',textAlign:'center',maxWidth:280,width:'100%'}}>
            <div style={{fontSize:48,marginBottom:8}}>💞</div>
            <h2 style={{fontSize:22,fontWeight:900,color:'#be185d',marginBottom:6}}>It's a Match!</h2>
            <p style={{fontSize:13,color:'#64748b',marginBottom:20}}>You and <strong>{matchPop.name}</strong> liked each other!</p>
            <button onClick={()=>{setMatchPop(null);router.push(`/chat/${matchPop.id}`)}}
              style={{background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',border:'none',borderRadius:12,padding:'12px 0',fontSize:14,fontWeight:700,cursor:'pointer',width:'100%'}}>
              Send a Message →
            </button>
          </div>
        </div>
      )}

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
                {dailyReward.streak===7?'🔥 Week streak bonus!':dailyReward.streak===3?'🔥 3-day streak bonus!':'Coins added to your wallet'}
              </p>
            </div>
            {/* Streak dots */}
            <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:16}}>
              {[1,2,3,4,5,6,7].map(d=>(
                <div key={d} style={{width:28,height:28,borderRadius:'50%',background:d<=dailyReward.streak?'#f97316':'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:d<=dailyReward.streak?'#fff':'#94a3b8'}}>
                  {d===7?'🔥':d}
                </div>
              ))}
            </div>
            <button onClick={()=>setDailyReward(null)} style={{width:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 14px rgba(249,115,22,0.4)'}}>
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'#fafaf7',borderBottom:'1px solid #ece9df'}}>
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
          <button onClick={()=>setSearchOpen(s=>!s)} style={{width:36,height:36,borderRadius:'50%',border:'1.5px solid #e8ecf0',background:searchOpen?'#fff7ed':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🔍</button>
        </div>
        {searchOpen&&(
          <div style={{padding:'8px 16px 12px'}}>
            <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)}
              placeholder="Search name or location..."
              style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:20,padding:'9px 16px',fontSize:14,outline:'none',background:'#fff',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
        )}
      </div>

      {/* Stories strip */}
      <Stories myId={me}/>

      {/* Location prompt */}
      {me&&!loc&&!loading&&(
        <div style={{background:'#f0fdf4',borderBottom:'1px solid #bbf7d0',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <p style={{fontSize:12,color:'#166534',fontWeight:600,margin:0}}>📍 Allow location to see people near you</p>
          <button onClick={()=>{
            if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})
          }} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0}}>
            Enable
          </button>
        </div>
      )}

      {/* Logged out banner */}
      {!me&&!loading&&(
        <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',padding:'10px 16px',
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <p style={{color:'#fff',fontWeight:700,fontSize:13,margin:0}}>👀 Sign up free to chat & connect</p>
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <button onClick={()=>router.push('/login')} style={{background:'rgba(255,255,255,0.2)',color:'#fff',border:'1px solid rgba(255,255,255,0.5)',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Login</button>
            <button onClick={()=>router.push('/register')} style={{background:'#fff',color:'#f97316',border:'none',borderRadius:20,padding:'5px 12px',fontSize:12,fontWeight:800,cursor:'pointer'}}>Join Free</button>
          </div>
        </div>
      )}

      {/* List */}
      <div>
        {loading
          ?[...Array(3)].map((_,i)=>(
            <div key={i} style={{background:'#fff',marginBottom:8,padding:16,display:'flex',gap:14,alignItems:'center'}}>
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
            const extras:string[]=Array.isArray(s.photos)?s.photos.filter((p:string)=>p&&p!==s.avatar_url).slice(0,4):[]
            const name=(s.full_name||'User').split(' ')[0]
            const locked=!me // not logged in

            return(
              <div key={s.id} onClick={()=>locked?router.push('/register'):router.push(`/profile/${s.id}`)}
                style={{background:'#fff',marginBottom:8,padding:'14px 16px',cursor:'pointer',borderBottom:'1px solid #f5f5f0'}}>

                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  {/* Avatar */}
                  <div style={{position:'relative',flexShrink:0}}>
                    <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',
                      border:s.is_featured?'3px solid #f97316':s.is_premium?'3px solid #f59e0b':'2px solid #e5e7eb'}}>
                      {s.avatar_url
                        ?<img src={s.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} alt={name}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',
                          background:`linear-gradient(135deg,${s.is_premium?'#7c3aed,#6d28d9':'#f97316,#ea580c'})`,
                          color:'#fff',fontSize:24,fontWeight:900}}>{initials(s.full_name)}</div>
                      }
                    </div>
                    <div style={{position:'absolute',bottom:2,right:2,width:12,height:12,borderRadius:'50%',
                      background:online?'#22c55e':'#d1d5db',border:'2.5px solid #fff'}}/>
                    {s.is_premium&&(
                      <div style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',
                        background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',
                        fontSize:8,padding:'1px 5px',borderRadius:4,fontWeight:900,whiteSpace:'nowrap',border:'1.5px solid #fff'}}>VIP</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0,paddingTop:2}}>
                    <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                      <span style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{s.full_name||'User'}</span>
                      {s.is_verified&&<span style={{color:'#2563eb',fontSize:14}}>✓</span>}
                      {isMatch&&<span style={{fontSize:13}}>💞</span>}
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {s.age&&<span style={{background:'#fce7f3',color:'#be185d',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700}}>{s.age} yrs</span>}
                      {distLabel&&<span style={{background:'#dcfce7',color:'#16a34a',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700}}>📍{distLabel}</span>}
                      {s.looking_for&&<span style={{background:'#ede9fe',color:'#7c3aed',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>
                        {s.looking_for==='relationship'?'💕 Dating':s.looking_for==='friendship'?'🤝 Friends':s.looking_for==='study'?'📚 Study':'🌐 Network'}
                      </span>}
                      {online
                        ?<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:700}}>🟢 Online</span>
                        :s.last_seen&&<span style={{background:'#f1f5f9',color:'#64748b',fontSize:11,padding:'3px 8px',borderRadius:20,fontWeight:600}}>
                          🕐 {(()=>{
                            const m=Math.floor((Date.now()-new Date(s.last_seen).getTime())/60000)
                            if(m<60) return `${m}m ago`
                            const h=Math.floor(m/60)
                            if(h<24) return `${h}h ago`
                            return `${Math.floor(h/24)}d ago`
                          })()}
                        </span>
                      }
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div onClick={e=>e.stopPropagation()} style={{flexShrink:0,display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
                    {/* Hi button */}
                    <button onClick={()=>locked?router.push('/register'):router.push(`/chat/${s.id}`)}
                      style={{background:locked?'#e2e8f0':'linear-gradient(135deg,#f97316,#fb923c)',
                        color:locked?'#94a3b8':'#fff',border:'none',borderRadius:20,padding:'7px 16px',
                        fontSize:14,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',gap:5,
                        boxShadow:locked?'none':'0 3px 12px rgba(249,115,22,0.45)',minWidth:64,justifyContent:'center'}}>
                      <span style={{fontSize:16}}>💬</span> Hi
                    </button>
                    {/* Super Like ⭐ */}
                    <button onClick={e=>locked?router.push('/register'):superLike(e,s.id,name)}
                      title="Super Like — 10 coins"
                      style={{width:34,height:34,borderRadius:'50%',
                        border:`1.5px solid ${superLiked.has(s.id)?'#f59e0b':'#e2e8f0'}`,
                        background:superLiked.has(s.id)?'linear-gradient(135deg,#f59e0b,#d97706)':'#fff',
                        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,
                        boxShadow:superLiked.has(s.id)?'0 2px 8px rgba(245,158,11,0.4)':'none'}}>
                      ⭐
                    </button>
                    {/* Like */}
                    <button onClick={e=>locked?router.push('/register'):like(e,s.id,name)}
                      style={{width:34,height:34,borderRadius:'50%',
                        border:`1.5px solid ${isMatch||isLiked?'#ec4899':'#e2e8f0'}`,
                        background:isMatch?'linear-gradient(135deg,#ec4899,#be185d)':isLiked?'#fdf2f8':'#fff',
                        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
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
                      <div key={i} style={{height:80,borderRadius:8,overflow:'hidden',background:'#f1f5f9',flexShrink:0}}>
                        <img src={p} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} alt="" loading="lazy"/>
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
