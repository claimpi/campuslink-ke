'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

function ini(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

function HomeApp() {
  const router = useRouter()
  const sp = useSearchParams()
  const isNew = sp.get('new')==='true'
  const [profiles,setProfiles] = useState<any[]>([])
  const [idx,setIdx] = useState(0)
  const [me,setMe] = useState<any>(null)
  const [loading,setLoading] = useState(true)
  const [dragX,setDragX] = useState(0)
  const [dragging,setDragging] = useState(false)
  const [gone,setGone] = useState<'like'|'pass'|null>(null)
  const [photoIdx,setPhotoIdx] = useState(0)
  const [matchPop,setMatchPop] = useState<any>(null)
  const [welcome,setWelcome] = useState(isNew)
  const [dailyCoins,setDailyCoins] = useState<any>(null)
  const [unread,setUnread] = useState(0)
  const [liked,setLiked] = useState<Set<string>>(new Set())
  const sx = useRef(0), sy = useRef(0)
  const THRESHOLD = 85

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}}:any)=>{
      if(!user){router.replace('/');return}
      sb.from('profiles').select('*').eq('id',user.id).maybeSingle().then(({data}:any)=>setMe(data))
      sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id',user.id).is('read_at',null).then(({count}:any)=>setUnread(count||0))
      sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data}:any)=>{if(data)setLiked(new Set(data.map((l:any)=>l.receiver_id)))})
      fetch('/api/daily-reward',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})})
        .then(r=>r.json()).then(d=>{if(d.success)setDailyCoins(d)})
      sb.from('profiles')
        .select('id,full_name,avatar_url,photos,age,looking_for,bio,location_name,is_premium,is_verified,interests')
        .neq('id',user.id)
        .order('is_featured',{ascending:false})
        .order('last_seen',{ascending:false,nullsFirst:false})
        .limit(50)
        .then(({data}:any)=>{if(data)setProfiles(data);setLoading(false)})
      sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
    })
  },[])
  useEffect(()=>setPhotoIdx(0),[idx])

  function start(x:number,y:number){sx.current=x;sy.current=y;setDragging(true)}
  function move(x:number,y:number){
    if(!dragging)return
    const dx=x-sx.current,dy=Math.abs(y-sy.current)
    if(dy>50){setDragX(0);return}
    setDragX(dx)
  }
  function end(){
    if(!dragging)return
    setDragging(false)
    if(dragX>THRESHOLD)doLike()
    else if(dragX<-THRESHOLD)doPass()
    else setDragX(0)
  }

  async function doLike(){
    const p=profiles[idx];if(!p||!me)return
    setGone('like');setLiked(s=>new Set([...s,p.id]))
    setTimeout(async()=>{
      const r=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me.id,receiverId:p.id})})
      const d=await r.json()
      if(d.isMatch)setMatchPop(p)
      next()
    },360)
  }
  function doPass(){setGone('pass');setTimeout(next,360)}
  function next(){setDragX(0);setGone(null);setIdx(i=>i+1)}

  const profile=profiles[idx]
  const photos=profile?[profile.avatar_url,...(Array.isArray(profile.photos)?profile.photos:[])].filter(Boolean):[]
  const rot=dragX*0.055
  const likeOp=Math.max(0,Math.min(1,dragX/THRESHOLD))
  const passOp=Math.max(0,Math.min(1,-dragX/THRESHOLD))

  if(loading)return(
    <div style={{height:'100dvh',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
      <div style={{fontSize:52,animation:'pulse 1.2s ease infinite'}}>💕</div>
      <div className="spin" style={{width:28,height:28,border:'3px solid #fde8ef',borderTopColor:'#f43f5e',borderRadius:'50%'}}/>
    </div>
  )

  return(
    <div style={{height:'100dvh',background:'#f8f8f8',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Welcome */}
      {welcome&&<Modal><div style={{fontSize:56,marginBottom:10}}>🎉</div><h2 style={{fontSize:21,fontWeight:900,color:'#111',marginBottom:5}}>You're all set!</h2><p style={{color:'#888',fontSize:13,marginBottom:4}}>You got <strong style={{color:'#f43f5e'}}>20 free coins</strong> 🪙</p><p style={{color:'#bbb',fontSize:12,marginBottom:20}}>Swipe right ❤️ to like · left to pass</p><MBtn onClick={()=>setWelcome(false)}>Let's Go! 🎉</MBtn></Modal>}

      {/* Daily coins */}
      {dailyCoins&&!welcome&&(
        <Modal onClick={()=>setDailyCoins(null)}>
          <div style={{fontSize:48,marginBottom:8}}>🎁</div>
          <h2 style={{fontSize:18,fontWeight:900,color:'#111',marginBottom:10}}>Daily Reward!</h2>
          <div style={{background:'linear-gradient(135deg,#f43f5e,#ec4899)',borderRadius:14,padding:'12px 28px',marginBottom:16}}>
            <p style={{color:'#fff',fontSize:28,fontWeight:900,margin:0}}>+{dailyCoins.coins} 🪙</p>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:11,margin:'3px 0 0'}}>Day {dailyCoins.streak} streak</p>
          </div>
          <MBtn onClick={()=>setDailyCoins(null)}>Awesome! 🎉</MBtn>
        </Modal>
      )}

      {/* Match */}
      {matchPop&&(
        <div style={{position:'fixed',inset:0,background:'linear-gradient(160deg,#f43f5e,#ec4899)',zIndex:999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:28,textAlign:'center'}}>
          <div style={{fontSize:68,marginBottom:10}}>💞</div>
          <h2 style={{color:'#fff',fontSize:28,fontWeight:900,marginBottom:6}}>It's a Match!</h2>
          <p style={{color:'rgba(255,255,255,0.85)',fontSize:15,marginBottom:24}}>You and <strong>{matchPop.full_name?.split(' ')[0]}</strong> liked each other</p>
          <div style={{display:'flex',gap:12,marginBottom:28}}>
            {[me?.avatar_url,matchPop.avatar_url].map((img:string,i:number)=>(
              <div key={i} style={{width:76,height:76,borderRadius:'50%',overflow:'hidden',border:'3px solid #fff',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:20}}>
                {img?<img src={img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:ini(i===0?me?.full_name||'?':matchPop.full_name)}
              </div>
            ))}
          </div>
          <button onClick={()=>{setMatchPop(null);router.push(`/chat/${matchPop.id}`)}} style={{width:'100%',maxWidth:300,padding:'15px',borderRadius:50,border:'none',background:'#fff',color:'#f43f5e',fontSize:15,fontWeight:900,marginBottom:10}}>💬 Send Message</button>
          <button onClick={()=>setMatchPop(null)} style={{background:'transparent',border:'2px solid rgba(255,255,255,0.4)',color:'#fff',borderRadius:50,padding:'13px',fontSize:14,fontWeight:600,width:'100%',maxWidth:300}}>Keep Swiping</button>
        </div>
      )}

      {/* TOP BAR */}
      <div style={{background:'#fff',padding:'13px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 1px 0 #f0f0f0'}}>
        <button onClick={()=>router.push('/dashboard')} style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #f43f5e',background:'#f9f9f9',display:'flex',alignItems:'center',justifyContent:'center',padding:0,flexShrink:0}}>
          {me?.avatar_url?<img src={me.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:<span style={{fontSize:13,fontWeight:800,color:'#f43f5e'}}>{ini(me?.full_name||'?')}</span>}
        </button>
        <h1 style={{fontSize:17,fontWeight:900,color:'#111',letterSpacing:'-0.2px'}}>Discover</h1>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>router.push('/notifications')} style={{width:34,height:34,borderRadius:'50%',background:'#f5f5f5',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>🔔</button>
          <button onClick={()=>router.push('/discover')} style={{width:34,height:34,borderRadius:'50%',background:'#f5f5f5',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>⚡</button>
        </div>
      </div>

      {/* CARD STACK */}
      <div style={{flex:1,position:'relative',padding:'8px 12px 6px',overflow:'hidden'}}>
        {profiles[idx+1]&&(
          <div style={{position:'absolute',inset:'12px 18px 10px',borderRadius:22,overflow:'hidden',background:'#ccc',transform:'scale(0.94) translateY(14px)',zIndex:1,boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
            {profiles[idx+1].avatar_url&&<img src={profiles[idx+1].avatar_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.5,filter:'blur(1px)'}} alt=""/>}
          </div>
        )}
        {profile?(
          <div
            onMouseDown={e=>start(e.clientX,e.clientY)} onMouseMove={e=>move(e.clientX,e.clientY)} onMouseUp={end} onMouseLeave={end}
            onTouchStart={e=>start(e.touches[0].clientX,e.touches[0].clientY)}
            onTouchMove={e=>{e.preventDefault();move(e.touches[0].clientX,e.touches[0].clientY)}}
            onTouchEnd={end}
            style={{
              position:'absolute',inset:'8px 12px 6px',
              borderRadius:22,overflow:'hidden',background:'#1a1a1a',
              zIndex:2,boxShadow:'0 10px 36px rgba(0,0,0,0.2)',
              transform:gone?`translateX(${gone==='like'?'150%':'-150%'}) rotate(${gone==='like'?'28':'-28'}deg)`:`translateX(${dragX}px) rotate(${rot}deg)`,
              transition:dragging?'none':'transform 0.32s cubic-bezier(0.25,0.8,0.25,1)',
              cursor:dragging?'grabbing':'grab',userSelect:'none',transformOrigin:'50% 90%',
            }}>
            {likeOp>0.05&&(
              <div style={{position:'absolute',top:32,left:18,zIndex:10,transform:'rotate(-22deg)',opacity:likeOp,pointerEvents:'none'}}>
                <div style={{border:'3px solid #22c55e',borderRadius:8,padding:'4px 14px',background:'rgba(34,197,94,0.1)'}}>
                  <span style={{color:'#22c55e',fontWeight:900,fontSize:26,letterSpacing:2}}>LIKE</span>
                </div>
              </div>
            )}
            {passOp>0.05&&(
              <div style={{position:'absolute',top:32,right:18,zIndex:10,transform:'rotate(22deg)',opacity:passOp,pointerEvents:'none'}}>
                <div style={{border:'3px solid #ef4444',borderRadius:8,padding:'4px 14px',background:'rgba(239,68,68,0.1)'}}>
                  <span style={{color:'#ef4444',fontWeight:900,fontSize:26,letterSpacing:2}}>NOPE</span>
                </div>
              </div>
            )}
            <div style={{position:'absolute',inset:0}}>
              {photos[photoIdx]?<img src={photos[photoIdx]} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} alt="" draggable={false}/>:<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f43f5e,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,color:'#fff',fontWeight:900}}>{ini(profile.full_name)}</div>}
            </div>
            {photos.length>1&&<>
              <div style={{position:'absolute',top:0,left:0,width:'40%',height:'65%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.max(0,i-1))}}/>
              <div style={{position:'absolute',top:0,right:0,width:'40%',height:'65%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.min(photos.length-1,i+1))}}/>
            </>}
            {photos.length>1&&(
              <div style={{position:'absolute',top:10,left:10,right:10,display:'flex',gap:3,zIndex:6,pointerEvents:'none'}}>
                {photos.map((_:any,i:number)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i===photoIdx?'#fff':'rgba(255,255,255,0.3)',transition:'background 0.2s'}}/>)}
              </div>
            )}
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 45%,transparent 72%)',pointerEvents:'none'}}/>
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'18px 18px 14px',pointerEvents:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4}}>
                <span style={{color:'#fff',fontSize:23,fontWeight:900,letterSpacing:'-0.3px'}}>{profile.full_name?.split(' ')[0]}{profile.age&&<span style={{fontWeight:400,marginLeft:6,fontSize:21}}>{profile.age}</span>}</span>
                {profile.is_verified&&<div style={{width:18,height:18,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#fff',fontSize:9,fontWeight:900}}>✓</span></div>}
                {profile.is_premium&&<span style={{background:'#f97316',color:'#fff',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:4}}>VIP</span>}
              </div>
              {profile.location_name&&<p style={{color:'rgba(255,255,255,0.7)',fontSize:12,marginBottom:7}}>📍 {profile.location_name}</p>}
              {profile.looking_for&&<span style={{display:'inline-flex',alignItems:'center',background:'rgba(255,255,255,0.15)',backdropFilter:'blur(6px)',color:'#fff',fontSize:11,padding:'4px 10px',borderRadius:50,fontWeight:600,border:'1px solid rgba(255,255,255,0.2)'}}>
                {profile.looking_for==='relationship'?'💕 Dating':profile.looking_for==='friendship'?'🤝 Friends':profile.looking_for==='casual'?'😊 Casual':'🌐 Network'}
              </span>}
            </div>
            <button onClick={e=>{e.stopPropagation();router.push(`/profile/${profile.id}`)}} style={{position:'absolute',bottom:16,right:14,width:32,height:32,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',background:'rgba(0,0,0,0.3)',color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',zIndex:7,cursor:'pointer'}}>ℹ</button>
          </div>
        ):(
          <div style={{position:'absolute',inset:'8px 12px 6px',borderRadius:22,background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,zIndex:2}}>
            <div style={{fontSize:60}}>🌍</div>
            <p style={{fontWeight:900,fontSize:17,color:'#111'}}>You've seen everyone!</p>
            <p style={{color:'#9ca3af',fontSize:13}}>Check back soon for new people</p>
            <button onClick={()=>{setIdx(0);setProfiles(p=>[...p])}} style={{marginTop:8,padding:'11px 26px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f43f5e,#ec4899)',color:'#fff',fontWeight:800,fontSize:14}}>🔄 Refresh</button>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      {profile&&(
        <div style={{background:'#fff',padding:'10px 0 12px',display:'flex',alignItems:'center',justifyContent:'center',gap:18,flexShrink:0,boxShadow:'0 -1px 0 #f0f0f0'}}>
          <ABtn size={52} border="#fca5a5" shadow="rgba(239,68,68,0.15)" onClick={doPass}><span style={{fontSize:20,color:'#9ca3af'}}>✕</span></ABtn>
          <ABtn size={52} bg="#22c55e" shadow="rgba(34,197,94,0.4)" onClick={()=>router.push(`/chat/${profile.id}`)}><span style={{fontSize:20}}>💬</span></ABtn>
          <ABtn size={62} bg="linear-gradient(135deg,#f43f5e,#ec4899)" shadow="rgba(244,63,94,0.45)" onClick={doLike}><span style={{fontSize:26}}>❤️</span></ABtn>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{background:'#fff',borderTop:'1px solid #f0f0f0',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[
          {icon:'🏠',label:'Home',path:'/home',active:true},
          {icon:'❤️',label:'Likes',path:'/discover',active:false},
          {icon:'💬',label:'Chat',path:'/chat',active:false,badge:unread},
          {icon:'📞',label:'Contacts',path:'/discover',active:false},
          {icon:'👤',label:'Profile',path:'/dashboard',active:false},
        ].map(tab=>(
          <button key={tab.label} onClick={()=>router.push(tab.path)} style={{flex:1,padding:'10px 0 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',position:'relative'}}>
            <span style={{fontSize:19,lineHeight:1,filter:tab.active?'none':'grayscale(1)',opacity:tab.active?1:0.45}}>{tab.icon}</span>
            <span style={{fontSize:9,fontWeight:tab.active?700:500,color:tab.active?'#f43f5e':'#9ca3af'}}>{tab.label}</span>
            {tab.active&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:4,height:4,borderRadius:'50%',background:'#f43f5e'}}/>}
            {(tab.badge||0)>0&&<div style={{position:'absolute',top:5,right:'calc(50% - 16px)',background:'#f43f5e',color:'#fff',fontSize:8,fontWeight:800,borderRadius:50,minWidth:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{(tab.badge||0)>9?'9+':tab.badge}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

function Modal({children,onClick}:any){
  return(
    <div onClick={onClick} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center',padding:24,backdropFilter:'blur(2px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:24,padding:'28px 22px',textAlign:'center',maxWidth:290,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',animation:'pop 0.3s ease'}}>{children}</div>
    </div>
  )
}
function MBtn({children,onClick}:any){return<button onClick={onClick} style={{width:'100%',padding:'14px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f43f5e,#ec4899)',color:'#fff',fontSize:15,fontWeight:900,boxShadow:'0 4px 16px rgba(244,63,94,0.3)'}}>{children}</button>}
function ABtn({children,size,bg,border,shadow,onClick}:any){
  const [p,setP]=useState(false)
  return<button onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onTouchStart={()=>setP(true)} onTouchEnd={()=>setP(false)} onClick={onClick}
    style={{width:size,height:size,borderRadius:'50%',border:border?`2px solid ${border}`:'none',background:bg||'#fff',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 14px ${shadow||'rgba(0,0,0,0.1)'}`,transform:p?'scale(0.88)':'scale(1)',transition:'transform 0.12s',flexShrink:0}}>{children}</button>
}

export default function HomePage(){
  return<Suspense fallback={<div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:48}}>💕</div></div>}><HomeApp/></Suspense>
}
