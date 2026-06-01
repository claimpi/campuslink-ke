'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function calcDist(lat1:number,lon1:number,lat2:number,lon2:number){
  const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export default function ProfilePage(){
  const {id}=useParams()
  const router=useRouter()
  const [profile,setProfile]=useState<any>(null)
  const [me,setMe]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [activeIdx,setActiveIdx]=useState(0)
  const [loc,setLoc]=useState<{lat:number,lng:number}|null>(null)
  const [liked,setLiked]=useState(false)
  const [following,setFollowing]=useState(false)
  const [followLoading,setFollowLoading]=useState(false)
  const autoSlideRef=useRef<any>(null)

  const GIFTS=[
    {type:'rose',   emoji:'🌹', label:'Rose',    coins:10},
    {type:'heart',  emoji:'💝', label:'Heart',   coins:20},
    {type:'star',   emoji:'⭐', label:'Star',    coins:50},
    {type:'crown',  emoji:'👑', label:'Crown',   coins:100},
    {type:'diamond',emoji:'💎', label:'Diamond', coins:200},
  ]

  useEffect(()=>{
    const sb=createClient()
    if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>setLoc({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{})
    sb.from('profiles').select('*').eq('id',id).maybeSingle().then(({data})=>{ setProfile(data); setLoading(false) })
    sb.auth.getUser().then(({data:{user}}:any)=>{
      if(!user) return
      setMe(user)
      sb.from('likes').select('id').eq('sender_id',user.id).eq('receiver_id',id).maybeSingle().then(({data})=>setLiked(!!data))
      sb.from('follows').select('id').eq('follower_id',user.id).eq('following_id',id).maybeSingle().then(({data})=>setFollowing(!!data))
    })
  },[id])

  useEffect(()=>{
    if(!profile) return
    const photos=getAllPhotos()
    if(photos.length<=1) return
    autoSlideRef.current=setInterval(()=>setActiveIdx(i=>(i+1)%photos.length),3000)
    return()=>clearInterval(autoSlideRef.current)
  },[profile])

  function getAllPhotos(){
    if(!profile) return []
    const photos:string[]=Array.isArray(profile.photos)?profile.photos:[]
    const all=[profile.avatar_url,...photos.filter((p:string)=>p&&p!==profile.avatar_url)].filter(Boolean)
    return all.length>0?all:[null]
  }

  async function handleLike(){
    if(!me){router.push('/login');return}
    setLiked(true)
    await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me.id,receiverId:id})})
  }

  async function handleFollow(){
    if(!me){router.push('/login');return}
    if(followLoading) return
    setFollowLoading(true)
    const sb=createClient()
    if(following){
      await sb.from('follows').delete().eq('follower_id',me.id).eq('following_id',id)
      setFollowing(false)
    } else {
      await sb.from('follows').insert([{follower_id:me.id,following_id:id}])
      setFollowing(true)
      fetch('/api/push-notify',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:id,title:'New Follower! 🎉',body:'Someone started following you',url:`/profile/${me.id}`})
      }).catch(()=>{})
      // Save in-app notification
      const {data:myProf} = await createClient().from('profiles').select('full_name').eq('id',me.id).maybeSingle()
      fetch('/api/notify',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:id,type:'follow',title:`👤 ${myProf?.full_name||'Someone'} followed you`,body:'Tap to view their profile',fromUserId:me.id,url:`/profile/${me.id}`})
      }).catch(()=>{})
    }
    setFollowLoading(false)
  }

  const [myCoins, setMyCoins] = useState(0)
  const [giftLoading, setGiftLoading] = useState<string|null>(null)
  const [giftDone, setGiftDone] = useState<string|null>(null)
  const [giftError, setGiftError] = useState('')

  useEffect(()=>{
    if(!me) return
    createClient().from('profiles').select('coins').eq('id',me.id).maybeSingle()
      .then(({data})=>setMyCoins(data?.coins||0))
  },[me])

  async function sendGift(type:string, coins:number){
    if(!me){router.push('/login');return}
    if(myCoins < coins){
      setGiftError(`Not enough coins. You have ${myCoins} 🪙, need ${coins} 🪙`)
      setTimeout(()=>setGiftError(''),3000)
      return
    }
    setGiftLoading(type); setGiftError('')
    const res = await fetch('/api/send-gift',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({senderId:me.id,receiverId:id,giftType:type})})
    const data = await res.json()
    if(data.success){
      setMyCoins(data.coinsLeft)
      setGiftDone(type)
      setTimeout(()=>setGiftDone(null),3000)
    } else if(data.error==='insufficient_coins'){
      setGiftError(`Need ${data.coinsNeeded} coins, you have ${data.coinsHave}`)
      setTimeout(()=>setGiftError(''),3000)
    } else {
      setGiftError(data.error||'Failed to send gift')
      setTimeout(()=>setGiftError(''),3000)
    }
    setGiftLoading(null)
  }

  const photos=getAllPhotos()
  const distKm=loc&&profile?.latitude?calcDist(loc.lat,loc.lng,profile.latitude,profile.longitude):null
  const distLabel=distKm!==null?(distKm<0.1?'<0.1km':`${distKm.toFixed(1)}km`):null
  const online=profile?.last_seen&&(Date.now()-new Date(profile.last_seen).getTime())/60000<5
  const isMe=me?.id===id

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:40,height:40,border:'3px solid #fed7aa',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if(!profile) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'#94a3b8'}}>Profile not found</p></div>

  return(
    <div style={{maxWidth:480,margin:'0 auto',background:'#fff',minHeight:'100vh',paddingBottom:40}}>

      {/* Fullscreen photo slider */}
      <div style={{position:'relative',height:'62vh',background:'#111',overflow:'hidden'}}>
        {photos[activeIdx]
          ?<img src={photos[activeIdx]} style={{width:'100%',height:'100%',objectFit:'cover',transition:'opacity 0.4s'}} alt=""/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:72,fontWeight:900}}>{initials(profile.full_name)}</div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,transparent 40%,transparent 55%,rgba(0,0,0,0.6) 100%)',pointerEvents:'none'}}/>
        <button onClick={()=>router.back()} style={{position:'absolute',top:16,left:16,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,0.4)',border:'none',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>←</button>

        {/* Progress bars */}
        {photos.length>1&&(
          <div style={{position:'absolute',top:8,left:52,right:52,display:'flex',gap:3}}>
            {photos.map((_,i)=>(
              <div key={i} style={{flex:1,height:2.5,borderRadius:2,background:i===activeIdx?'#fff':'rgba(255,255,255,0.4)',transition:'background 0.3s'}}/>
            ))}
          </div>
        )}

        {/* Thumbnails */}
        {photos.length>1&&(
          <div style={{position:'absolute',bottom:12,left:12,display:'flex',gap:6,overflowX:'auto',maxWidth:'calc(100% - 24px)'}}>
            {photos.map((p,i)=>(
              <div key={i} onClick={()=>{setActiveIdx(i);clearInterval(autoSlideRef.current)}}
                style={{width:54,height:54,borderRadius:8,overflow:'hidden',flexShrink:0,cursor:'pointer',
                  border:i===activeIdx?'2.5px solid #f97316':'2px solid rgba(255,255,255,0.5)'}}>
                {p?<img src={p} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                  :<div style={{width:'100%',height:'100%',background:'#f97316',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700}}>{initials(profile.full_name)}</div>
                }
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info card */}
      <div style={{background:'#fff',borderRadius:'20px 20px 0 0',marginTop:-20,position:'relative',padding:'20px'}}>

        {/* Name + badges + online */}
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <h1 style={{fontSize:22,fontWeight:900,color:'#0f172a',margin:0}}>{profile.full_name}</h1>
              {profile.is_verified&&<span style={{background:'#2563eb',color:'#fff',fontSize:10,padding:'2px 6px',borderRadius:4,fontWeight:700}}>✓</span>}
              {profile.is_premium&&<span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontSize:10,padding:'2px 6px',borderRadius:4,fontWeight:700}}>VIP</span>}
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {profile.age&&<span style={{background:'#fce7f3',color:'#be185d',fontSize:12,padding:'3px 10px',borderRadius:20,fontWeight:700}}>♀ {profile.age}</span>}
              {distLabel&&<span style={{background:'#dcfce7',color:'#16a34a',fontSize:12,padding:'3px 10px',borderRadius:20,fontWeight:700}}>📍{distLabel}</span>}
              {profile.location_name&&<span style={{background:'#f1f5f9',color:'#475569',fontSize:12,padding:'3px 10px',borderRadius:20,fontWeight:600}}>🗺 {profile.location_name}</span>}
            </div>
          </div>
          <div style={{background:online?'#f0fdf4':'#f1f5f9',border:`1px solid ${online?'#bbf7d0':'#e2e8f0'}`,borderRadius:20,padding:'5px 10px',display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:online?'#22c55e':'#d1d5db'}}/>
            <span style={{fontSize:11,fontWeight:700,color:online?'#16a34a':'#94a3b8'}}>{online?'Online':'Offline'}</span>
          </div>
        </div>

        <div style={{borderBottom:'1px solid #f1f5f9',marginBottom:16}}/>

        {/* Action buttons */}
        {!isMe&&(
          <div style={{display:'flex',gap:10,marginBottom:16}}>
            <button onClick={()=>me?router.push(`/chat/${id}`):router.push('/login')}
              style={{flex:1,height:44,borderRadius:22,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:'0 3px 12px rgba(245,158,11,0.4)'}}>
              <span style={{fontSize:17}}>💬</span> Chat
            </button>
            <button onClick={handleFollow} disabled={followLoading}
              style={{flex:1,height:44,borderRadius:22,border:'none',cursor:'pointer',background:following?'#0f172a':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:6,boxShadow:`0 3px 12px ${following?'rgba(0,0,0,0.2)':'rgba(249,115,22,0.4)'}`}}>
              <span style={{fontSize:17}}>{followLoading?'⏳':following?'✓':'❤️'}</span> {followLoading?'...':following?'Following':'Follow'}
            </button>
            <button onClick={handleLike}
              style={{width:44,height:44,borderRadius:'50%',flexShrink:0,border:`1.5px solid ${liked?'#ec4899':'#e2e8f0'}`,background:liked?'linear-gradient(135deg,#ec4899,#be185d)':'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="17" height="16" viewBox="0 0 24 21" fill={liked?'#fff':'none'} stroke={liked?'#fff':'#ccc'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21C12 21 2 13.5 2 7a5 5 0 0 1 10 0 5 5 0 0 1 10 0c0 6.5-10 14-10 14z"/></svg>
            </button>
          </div>
        )}

        {/* Status */}
        {profile.status&&<div style={{marginBottom:16}}><p style={{fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Status</p><p style={{fontSize:14,color:'#374151',lineHeight:1.6,margin:0}}>{profile.status}</p></div>}

        {/* Bio */}
        {profile.bio&&<div style={{marginBottom:16}}><p style={{fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>About Me</p><p style={{fontSize:14,color:'#374151',lineHeight:1.6,margin:0}}>{profile.bio}</p></div>}

        {/* About tags */}
        {(profile.looking_for||profile.gender||profile.interests?.length>0)&&(
          <div style={{marginBottom:16}}>
            <p style={{fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>About Me</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
              {profile.looking_for&&<span style={{background:'#f1f5f9',color:'#374151',fontSize:13,padding:'6px 14px',borderRadius:20,fontWeight:600}}>{profile.looking_for==='relationship'?'💕 Dating':profile.looking_for==='friendship'?'🤝 Friends':profile.looking_for==='study'?'📚 Study':'🌐 Network'}</span>}
              {profile.gender&&<span style={{background:'#f1f5f9',color:'#374151',fontSize:13,padding:'6px 14px',borderRadius:20,fontWeight:600,textTransform:'capitalize'}}>{profile.gender==='male'?'👨 Male':'👩 Female'}</span>}
              {profile.interests?.map((interest:string,i:number)=>(
                <span key={i} style={{background:'#fff7ed',color:'#f97316',fontSize:13,padding:'6px 14px',borderRadius:20,fontWeight:600}}>{interest}</span>
              ))}
            </div>
          </div>
        )}

        {/* Gifts - always visible */}
        {!isMe&&(
          <div style={{marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <p style={{fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',margin:0}}>🎁 Send a Gift</p>
              <div style={{display:'flex',alignItems:'center',gap:4,background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:20,padding:'3px 10px',cursor:'pointer'}} onClick={()=>router.push('/pricing')}>
                <span style={{fontSize:12}}>🪙</span>
                <span style={{fontSize:12,fontWeight:700,color:'#f97316'}}>{myCoins}</span>
              </div>
            </div>
            {giftError&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 12px',marginBottom:8,fontSize:12,color:'#dc2626',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {giftError}
              <button onClick={()=>router.push('/pricing')} style={{background:'#f97316',color:'#fff',border:'none',borderRadius:8,padding:'4px 10px',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0,marginLeft:8}}>Buy Coins</button>
            </div>}
            <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
              {GIFTS.map(g=>(
                <div key={g.type} onClick={()=>giftLoading||giftDone===g.type?null:sendGift(g.type,g.coins)}
                  style={{flexShrink:0,background:giftDone===g.type?'#f0fdf4':myCoins>=g.coins?'#fff7ed':'#f8fafc',
                    border:`1.5px solid ${giftDone===g.type?'#bbf7d0':myCoins>=g.coins?'#fed7aa':'#e2e8f0'}`,
                    borderRadius:14,padding:'10px 14px',textAlign:'center',
                    cursor:giftLoading?'not-allowed':myCoins>=g.coins?'pointer':'not-allowed',
                    minWidth:68,transition:'all 0.2s',
                    opacity:myCoins>=g.coins||giftDone===g.type?1:0.5}}>
                  <div style={{fontSize:26,marginBottom:4}}>
                    {giftLoading===g.type?'⏳':giftDone===g.type?'✅':g.emoji}
                  </div>
                  <p style={{fontSize:11,fontWeight:700,color:'#374151',margin:'0 0 2px'}}>{g.label}</p>
                  <p style={{fontSize:10,fontWeight:700,margin:0,color:myCoins>=g.coins?'#f97316':'#94a3b8'}}>🪙 {g.coins}</p>
                </div>
              ))}
            </div>
            {myCoins<10&&(
              <button onClick={()=>router.push('/pricing')} style={{width:'100%',marginTop:8,background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:10,padding:'9px',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                🪙 Buy Coins to Send Gifts
              </button>
            )}
          </div>
        )}

        {/* Coin Transfer */}
        {!isMe&&<CoinTransfer myId={me?.id} targetId={id as string} targetName={profile.full_name?.split(' ')[0]||'them'} router={router}/>}

        {/* Edit button for own profile */}
        {isMe&&(
          <button onClick={()=>router.push('/dashboard/profile')}
            style={{width:'100%',height:46,borderRadius:23,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:15,fontWeight:800,boxShadow:'0 4px 14px rgba(249,115,22,0.4)'}}>
            ✏️ Edit My Profile
          </button>
        )}
      </div>
    </div>
  )
}

function CoinTransfer({myId, targetId, targetName, router}: {myId:string|undefined, targetId:string, targetName:string, router:any}){
  const [coins, setCoins] = useState(0)
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    if(!myId) return
    createClient().from('profiles').select('coins').eq('id',myId).maybeSingle().then(({data})=>setCoins(data?.coins||0))
  },[myId])

  async function send(){
    if(!myId){router.push('/login');return}
    const amt=parseInt(amount)
    if(!amt||amt<1){setError('Enter a valid amount');return}
    if(amt>coins){setError(`You only have ${coins} coins`);return}
    setLoading(true); setError('')
    const res=await fetch('/api/transfer-coins',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({senderId:myId,receiverId:targetId,amount:amt,message:msg||undefined})})
    const data=await res.json()
    if(data.success){
      setCoins(data.senderCoins); setDone(true); setAmount(''); setMsg('')
      setTimeout(()=>setDone(false),3000)
    } else setError(data.error==='insufficient_coins'?`Not enough coins (you have ${data.coinsHave})`:data.error||'Failed')
    setLoading(false)
  }

  return(
    <div style={{marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:open?10:0}}>
        <p style={{fontSize:12,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.5px',margin:0}}>🪙 Send Coins</p>
        <button onClick={()=>setOpen(o=>!o)} style={{fontSize:12,color:'#f97316',fontWeight:700,background:'none',border:'none',cursor:'pointer'}}>{open?'Hide':'Send coins to '+targetName}</button>
      </div>
      {open&&(
        <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:14,padding:14}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <span style={{fontSize:18}}>🪙</span>
            <span style={{fontSize:13,color:'#92400e',fontWeight:600}}>Your balance: <strong>{coins} coins</strong></span>
          </div>
          {done&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'8px 12px',marginBottom:10,fontSize:13,color:'#16a34a',fontWeight:600}}>✅ Coins sent to {targetName}!</div>}
          {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 12px',marginBottom:10,fontSize:13,color:'#dc2626'}}>{error}</div>}
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            {[10,20,50,100].map(a=>(
              <button key={a} onClick={()=>setAmount(String(a))} style={{flex:1,padding:'7px 0',borderRadius:8,border:`1.5px solid ${amount===String(a)?'#f97316':'#e2e8f0'}`,background:amount===String(a)?'#fff7ed':'#fff',color:amount===String(a)?'#f97316':'#374151',fontSize:13,fontWeight:700,cursor:'pointer'}}>{a}</button>
            ))}
          </div>
          <input value={amount} onChange={e=>setAmount(e.target.value.replace(/\D/g,''))} placeholder="Custom amount..."
            style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',marginBottom:8,boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder={`Message (optional)`}
            style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:8,padding:'8px 12px',fontSize:14,outline:'none',marginBottom:10,boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          <button onClick={send} disabled={loading||!amount}
            style={{width:'100%',background:!amount||loading?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:10,padding:'11px',fontSize:14,fontWeight:700,cursor:!amount||loading?'not-allowed':'pointer'}}>
            {loading?'Sending...':`Send ${amount||'?'} coins to ${targetName} 🪙`}
          </button>
        </div>
      )}
    </div>
  )
}
