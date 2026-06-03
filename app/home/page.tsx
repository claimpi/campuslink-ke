'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function ini(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

function HomeApp() {
  const router = useRouter()
  const sp = useSearchParams()
  const isNew = sp.get('new')==='true'
  const [profiles, setProfiles] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [me, setMe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [gone, setGone] = useState<'like'|'pass'|null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [matchPop, setMatchPop] = useState<any>(null)
  const [welcome, setWelcome] = useState(isNew)
  const [dailyCoins, setDailyCoins] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const SWIPE = 90

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }:any) => {
      if (!user) { router.replace('/'); return }
      sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }:any) => setMe(data))
      sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id',user.id).is('read_at',null).then(({count}:any)=>setUnread(count||0))
      fetch('/api/daily-reward',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})})
        .then(r=>r.json()).then(d=>{if(d.success)setDailyCoins(d)})
      sb.from('profiles')
        .select('id,full_name,avatar_url,photos,age,gender,looking_for,bio,location_name,is_premium,is_verified,interests')
        .neq('id',user.id)
        .order('is_featured',{ascending:false})
        .order('last_seen',{ascending:false,nullsFirst:false})
        .limit(60)
        .then(({data}:any)=>{ if(data) setProfiles(data); setLoading(false) })
      sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
    })
  },[])

  useEffect(()=>{ setPhotoIdx(0) },[idx])

  function startDrag(x:number,y:number){ startX.current=x; startY.current=y; setIsDragging(true) }
  function moveDrag(x:number,y:number){
    if(!isDragging)return
    const dy=Math.abs(y-startY.current)
    if(dy>40){setDragX(0);return}
    setDragX(x-startX.current)
  }
  function endDrag(){
    if(!isDragging)return
    setIsDragging(false)
    if(dragX>SWIPE) doLike()
    else if(dragX<-SWIPE) doPass()
    else setDragX(0)
  }

  async function doLike(){
    const p=profiles[idx]
    if(!p)return
    setGone('like')
    setTimeout(async()=>{
      const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me?.id,receiverId:p.id})})
      const d=await res.json()
      if(d.isMatch) setMatchPop(p)
      next()
    },350)
  }
  function doPass(){ setGone('pass'); setTimeout(next,350) }
  function next(){ setDragX(0); setGone(null); setIdx(i=>i+1) }

  const profile = profiles[idx]
  const photos = profile ? [profile.avatar_url,...(Array.isArray(profile.photos)?profile.photos:[])].filter(Boolean) : []
  const rot = dragX*0.05
  const likeOp = Math.min(1, dragX/SWIPE)
  const passOp = Math.min(1, -dragX/SWIPE)

  if(loading) return(
    <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{fontSize:48,animation:'heartbeat 1.2s ease infinite'}}>💕</div>
      <div className="spin" style={{width:32,height:32,border:'3px solid #ffe4d6',borderTopColor:'#f97316',borderRadius:'50%'}}/>
    </div>
  )

  return (
    <div style={{height:'100dvh',background:'#f5f5f5',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>

      {/* Welcome popup */}
      {welcome&&(
        <Popup>
          <div style={{fontSize:60,marginBottom:12}}>🎉</div>
          <h2 style={{fontSize:22,fontWeight:900,color:'#111',marginBottom:6}}>Welcome!</h2>
          <p style={{color:'#888',fontSize:14,marginBottom:6}}>You got <strong style={{color:'#f97316'}}>10 free coins</strong> to start chatting</p>
          <p style={{color:'#bbb',fontSize:13,marginBottom:24}}>Swipe right to like ❤️ · left to pass</p>
          <PopBtn onClick={()=>setWelcome(false)}>Let's Go! 💕</PopBtn>
        </Popup>
      )}

      {/* Daily coins popup */}
      {dailyCoins&&!welcome&&(
        <Popup onClick={()=>setDailyCoins(null)}>
          <div style={{fontSize:52,marginBottom:10}}>🎁</div>
          <h2 style={{fontSize:20,fontWeight:900,color:'#111',marginBottom:8}}>Daily Reward!</h2>
          <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:16,padding:'14px 24px',margin:'0 0 18px'}}>
            <p style={{color:'#fff',fontSize:30,fontWeight:900,margin:0}}>+{dailyCoins.coins} 🪙</p>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:12,margin:'4px 0 0'}}>Day {dailyCoins.streak} streak</p>
          </div>
          <PopBtn onClick={()=>setDailyCoins(null)}>Awesome! 🎉</PopBtn>
        </Popup>
      )}

      {/* Match popup */}
      {matchPop&&(
        <div style={{position:'fixed',inset:0,background:'linear-gradient(135deg,rgba(249,115,22,0.97),rgba(236,72,153,0.97))',zIndex:999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:28,textAlign:'center'}}>
          <div style={{fontSize:72,marginBottom:14,animation:'pop 0.5s ease'}}>💞</div>
          <h2 style={{color:'#fff',fontSize:30,fontWeight:900,marginBottom:8,letterSpacing:'-0.5px'}}>It's a Match!</h2>
          <p style={{color:'rgba(255,255,255,0.85)',fontSize:16,marginBottom:28}}>You and <strong>{matchPop.full_name?.split(' ')[0]}</strong> liked each other</p>
          <div style={{display:'flex',gap:16,marginBottom:32}}>
            {[me?.avatar_url,matchPop.avatar_url].map((img:string,i:number)=>(
              <div key={i} style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',border:'3px solid #fff',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:22}}>
                {img?<img src={img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:ini(i===0?me?.full_name||'?':matchPop.full_name)}
              </div>
            ))}
          </div>
          <button onClick={()=>{setMatchPop(null);router.push(`/chat/${matchPop.id}`)}}
            style={{width:'100%',maxWidth:320,padding:'16px',borderRadius:50,border:'none',background:'#fff',color:'#f97316',fontSize:16,fontWeight:900,marginBottom:12,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
            💬 Send a Message
          </button>
          <button onClick={()=>setMatchPop(null)}
            style={{background:'transparent',border:'2px solid rgba(255,255,255,0.5)',color:'#fff',borderRadius:50,padding:'14px',fontSize:14,fontWeight:700,width:'100%',maxWidth:320}}>
            Keep Swiping
          </button>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:'#fff',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 1px 0 #f0f0f0'}}>
        <div style={{fontSize:22,animation:'heartbeat 2s ease infinite'}}>💕</div>
        <h1 style={{fontSize:17,fontWeight:900,color:'#111',letterSpacing:'-0.3px'}}>CampusLink <span style={{color:'#f97316'}}>KE</span></h1>
        <div style={{display:'flex',gap:8}}>
          <NavBtn onClick={()=>router.push('/notifications')}>🔔</NavBtn>
          <NavBtn onClick={()=>router.push('/pricing')} badge={me?.coins}>🪙</NavBtn>
        </div>
      </div>

      {/* CARD AREA */}
      <div style={{flex:1,position:'relative',padding:'10px 14px 6px',overflow:'hidden'}}>

        {/* Back card (next profile preview) */}
        {profiles[idx+1]&&(
          <div style={{position:'absolute',inset:'14px 20px 10px',borderRadius:22,overflow:'hidden',background:'#ddd',transform:'scale(0.94) translateY(12px)',zIndex:1,boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
            {profiles[idx+1].avatar_url&&<img src={profiles[idx+1].avatar_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.6,filter:'blur(1px)'}} alt=""/>}
          </div>
        )}

        {/* Main card */}
        {profile?(
          <div
            onMouseDown={e=>startDrag(e.clientX,e.clientY)}
            onMouseMove={e=>moveDrag(e.clientX,e.clientY)}
            onMouseUp={endDrag} onMouseLeave={endDrag}
            onTouchStart={e=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
            onTouchMove={e=>{e.preventDefault();moveDrag(e.touches[0].clientX,e.touches[0].clientY)}}
            onTouchEnd={endDrag}
            style={{
              position:'absolute',inset:'10px 14px 6px',
              borderRadius:22,overflow:'hidden',
              background:'#222',zIndex:2,
              boxShadow:'0 8px 36px rgba(0,0,0,0.18)',
              transform:`translateX(${dragX}px) rotate(${rot}deg)`,
              transition:isDragging?'none':gone?'transform 0.35s ease,opacity 0.35s':'transform 0.25s ease',
              opacity:gone?0:1,
              cursor:isDragging?'grabbing':'grab',
              userSelect:'none',
              transformOrigin:'50% 90%',
            }}>

            {/* LIKE / PASS overlays */}
            {likeOp>0.06&&(
              <div style={{position:'absolute',top:28,left:18,zIndex:8,transform:'rotate(-18deg)',opacity:likeOp}}>
                <div style={{border:'3.5px solid #22c55e',borderRadius:8,padding:'5px 14px'}}>
                  <span style={{color:'#22c55e',fontWeight:900,fontSize:24,letterSpacing:1}}>LIKE 💚</span>
                </div>
              </div>
            )}
            {passOp>0.06&&(
              <div style={{position:'absolute',top:28,right:18,zIndex:8,transform:'rotate(18deg)',opacity:passOp}}>
                <div style={{border:'3.5px solid #ef4444',borderRadius:8,padding:'5px 14px'}}>
                  <span style={{color:'#ef4444',fontWeight:900,fontSize:24,letterSpacing:1}}>PASS ✕</span>
                </div>
              </div>
            )}

            {/* Photo */}
            <div style={{position:'absolute',inset:0}}>
              {photos[photoIdx]
                ?<img src={photos[photoIdx]} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} alt=""/>
                :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f97316,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,fontWeight:900,color:'#fff'}}>{ini(profile.full_name)}</div>
              }
            </div>

            {/* Photo nav zones */}
            {photos.length>1&&<>
              <div style={{position:'absolute',top:0,left:0,width:'40%',height:'65%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.max(0,i-1))}}/>
              <div style={{position:'absolute',top:0,right:0,width:'40%',height:'65%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.min(photos.length-1,i+1))}}/>
            </>}

            {/* Photo dots */}
            {photos.length>1&&(
              <div style={{position:'absolute',top:10,left:10,right:10,display:'flex',gap:4,zIndex:6}}>
                {photos.map((_:any,i:number)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i===photoIdx?'#fff':'rgba(255,255,255,0.35)',transition:'background 0.2s'}}/>)}
              </div>
            )}

            {/* Gradient */}
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.35) 45%,transparent 70%)',pointerEvents:'none'}}/>

            {/* Info */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'20px 20px 18px',pointerEvents:'none'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,marginBottom:6}}>
                <span style={{color:'#fff',fontSize:24,fontWeight:900,letterSpacing:'-0.5px'}}>{profile.full_name?.split(' ')[0]}</span>
                {profile.age&&<span style={{color:'rgba(255,255,255,0.85)',fontSize:22,fontWeight:400,marginBottom:1}}>{profile.age}</span>}
                {profile.is_verified&&<span style={{fontSize:15,marginBottom:2}}>✓</span>}
                {profile.is_premium&&<span style={{background:'#f97316',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,marginBottom:3}}>VIP</span>}
              </div>
              {profile.bio&&<p style={{color:'rgba(255,255,255,0.78)',fontSize:13,marginBottom:8,lineHeight:1.45,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{profile.bio}</p>}
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {profile.looking_for&&<Tag>{profile.looking_for==='relationship'?'💕 Dating':profile.looking_for==='friendship'?'🤝 Friends':profile.looking_for==='casual'?'😊 Casual':'🌐 Network'}</Tag>}
                {profile.location_name&&<Tag>📍 {profile.location_name}</Tag>}
                {(profile.interests||[]).slice(0,2).map((i:string)=><Tag key={i}>{i}</Tag>)}
              </div>
            </div>

            {/* Info icon */}
            <button onClick={e=>{e.stopPropagation();router.push(`/profile/${profile.id}`)}}
              style={{position:'absolute',bottom:18,right:18,width:34,height:34,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.5)',background:'rgba(0,0,0,0.25)',color:'#fff',fontSize:15,display:'flex',alignItems:'center',justifyContent:'center',zIndex:7,pointerEvents:'all'}}>ℹ</button>
          </div>
        ):(
          <div style={{position:'absolute',inset:'10px 14px 6px',borderRadius:22,background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 4px 16px rgba(0,0,0,0.06)',zIndex:2}}>
            <div style={{fontSize:60}}>🌍</div>
            <p style={{fontWeight:900,fontSize:17,color:'#111'}}>You've seen everyone!</p>
            <p style={{color:'#94a3b8',fontSize:13}}>Check back soon for new people</p>
            <button onClick={()=>{setIdx(0);setProfiles(p=>[...p])}}
              style={{marginTop:8,padding:'12px 28px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontWeight:800,fontSize:14,boxShadow:'0 4px 14px rgba(249,115,22,0.3)'}}>
              🔄 Refresh
            </button>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      {profile&&(
        <div style={{background:'#fff',padding:'12px 24px',paddingBottom:'max(16px,env(safe-area-inset-bottom))',display:'flex',alignItems:'center',justifyContent:'center',gap:20,flexShrink:0,boxShadow:'0 -1px 0 #f0f0f0'}}>
          <ActionBtn size={52} border="#fecaca" shadow="rgba(239,68,68,0.15)" onClick={doPass}>
            <span style={{fontSize:22,lineHeight:1}}>✕</span>
          </ActionBtn>
          <ActionBtn size={44} border="#e0e7ff" shadow="rgba(99,102,241,0.1)" onClick={()=>router.push(`/chat/${profile.id}`)}>
            <span style={{fontSize:18,lineHeight:1}}>💬</span>
          </ActionBtn>
          <ActionBtn size={64} bg="linear-gradient(135deg,#f97316,#ec4899)" shadow="rgba(249,115,22,0.4)" onClick={doLike}>
            <span style={{fontSize:26,lineHeight:1,animation:'heartbeat 1.5s ease infinite'}}>❤️</span>
          </ActionBtn>
          <ActionBtn size={44} border="#e0e7ff" shadow="rgba(99,102,241,0.1)" onClick={()=>router.push(`/profile/${profile.id}`)}>
            <span style={{fontSize:18,lineHeight:1}}>👤</span>
          </ActionBtn>
          <ActionBtn size={52} border="#bbf7d0" shadow="rgba(34,197,94,0.1)" onClick={()=>router.push('/discover')}>
            <span style={{fontSize:20,lineHeight:1}}>⭐</span>
          </ActionBtn>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{background:'#fff',borderTop:'1px solid #f0f0f0',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[
          {icon:'💕',label:'Discover',path:'/home',active:true},
          {icon:'🔥',label:'Matches',path:'/discover',active:false},
          {icon:'💬',label:'Chat',path:'/chat',active:false,badge:unread},
          {icon:'👤',label:'Profile',path:'/dashboard',active:false},
        ].map(tab=>(
          <button key={tab.path} onClick={()=>router.push(tab.path)}
            style={{flex:1,padding:'10px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:3,position:'relative'}}>
            <span style={{fontSize:20,lineHeight:1}}>{tab.icon}</span>
            <span style={{fontSize:10,fontWeight:tab.active?700:500,color:tab.active?'#f97316':'#bbb'}}>{tab.label}</span>
            {tab.badge>0&&<div style={{position:'absolute',top:6,right:'calc(50% - 14px)',background:'#ef4444',color:'#fff',fontSize:9,fontWeight:800,borderRadius:50,minWidth:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{tab.badge>9?'9+':tab.badge}</div>}
            {tab.active&&<div style={{position:'absolute',bottom:0,left:'50%',transform:'translateX(-50%)',width:20,height:3,borderRadius:2,background:'#f97316'}}/>}
          </button>
        ))}
      </div>
    </div>
  )
}

function Tag({children}:any){return <span style={{background:'rgba(255,255,255,0.2)',backdropFilter:'blur(4px)',color:'#fff',fontSize:11,padding:'3px 10px',borderRadius:50,fontWeight:600}}>{children}</span>}
function NavBtn({children,onClick,badge}:any){return <button onClick={onClick} style={{width:34,height:34,borderRadius:'50%',border:'1px solid #f0f0f0',background:'#fff',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>{children}{badge!=null&&<span style={{position:'absolute',top:-2,right:-2,background:'#f97316',color:'#fff',fontSize:9,fontWeight:800,borderRadius:50,minWidth:15,height:15,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>{badge}</span>}</button>}
function ActionBtn({children,size,bg,border,shadow,onClick}:any){
  const [p,setP]=useState(false)
  return <button onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onTouchStart={()=>setP(true)} onTouchEnd={()=>setP(false)} onClick={onClick}
    style={{width:size,height:size,borderRadius:'50%',border:border?`2px solid ${border}`:'none',background:bg||'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 14px ${shadow||'rgba(0,0,0,0.1)'}`,transform:p?'scale(0.91)':'scale(1)',transition:'transform 0.12s',flexShrink:0}}>{children}</button>
}
function Popup({children,onClick}:any){
  return <div onClick={onClick} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center',padding:24,backdropFilter:'blur(2px)'}}>
    <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:24,padding:'32px 24px',textAlign:'center',maxWidth:300,width:'100%',animation:'pop 0.3s ease'}}>
      {children}
    </div>
  </div>
}
function PopBtn({children,onClick}:any){
  return <button onClick={onClick} style={{width:'100%',padding:'15px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:16,fontWeight:900,boxShadow:'0 4px 16px rgba(249,115,22,0.3)'}}>{children}</button>
}

export default function HomePage(){
  return <Suspense fallback={<div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:48,animation:'heartbeat 1.2s ease infinite'}}>💕</div></div>}><HomeApp/></Suspense>
}
