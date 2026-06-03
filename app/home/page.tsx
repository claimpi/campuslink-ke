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
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [gone, setGone] = useState<'like'|'pass'|null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [matchPop, setMatchPop] = useState<any>(null)
  const [welcome, setWelcome] = useState(isNew)
  const [dailyCoins, setDailyCoins] = useState<any>(null)
  const [unreadChat, setUnreadChat] = useState(0)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const startX = useRef(0)
  const startY = useRef(0)
  const SWIPE = 80

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}}:any)=>{
      if(!user){router.replace('/');return}
      sb.from('profiles').select('*').eq('id',user.id).maybeSingle().then(({data}:any)=>setMe(data))
      sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id',user.id).is('read_at',null).then(({count}:any)=>setUnreadChat(count||0))
      sb.from('likes').select('receiver_id').eq('sender_id',user.id).then(({data}:any)=>{if(data)setLikedIds(new Set(data.map((l:any)=>l.receiver_id)))})
      fetch('/api/daily-reward',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id})})
        .then(r=>r.json()).then(d=>{if(d.success)setDailyCoins(d)})
      sb.from('profiles')
        .select('id,full_name,avatar_url,photos,age,gender,looking_for,bio,location_name,is_premium,is_verified,interests')
        .neq('id',user.id)
        .order('is_featured',{ascending:false})
        .order('last_seen',{ascending:false,nullsFirst:false})
        .limit(60)
        .then(({data}:any)=>{if(data)setProfiles(data);setLoading(false)})
      sb.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id)
    })
  },[])

  useEffect(()=>setPhotoIdx(0),[idx])

  function startDrag(x:number,y:number){startX.current=x;startY.current=y;setIsDragging(true)}
  function moveDrag(x:number,y:number){
    if(!isDragging)return
    const dx=x-startX.current, dy=y-startY.current
    if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10){setDragX(0);return}
    setDragX(dx);setDragY(dy*0.1)
  }
  function endDrag(){
    if(!isDragging)return
    setIsDragging(false)
    if(dragX>SWIPE)doLike()
    else if(dragX<-SWIPE)doPass()
    else{setDragX(0);setDragY(0)}
  }

  async function doLike(){
    const p=profiles[idx]; if(!p||!me)return
    setGone('like')
    setLikedIds(s=>new Set([...s,p.id]))
    setTimeout(async()=>{
      const res=await fetch('/api/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senderId:me.id,receiverId:p.id})})
      const d=await res.json()
      if(d.isMatch)setMatchPop(p)
      next()
    },380)
  }
  function doPass(){setGone('pass');setTimeout(next,380)}
  function next(){setDragX(0);setDragY(0);setGone(null);setIdx(i=>i+1)}

  const profile=profiles[idx]
  const photos=profile?[profile.avatar_url,...(Array.isArray(profile.photos)?profile.photos:[])].filter(Boolean):[]
  const rot=dragX*0.055
  const likeOp=Math.max(0,Math.min(1,dragX/SWIPE))
  const passOp=Math.max(0,Math.min(1,-dragX/SWIPE))
  const isLiked=profile&&likedIds.has(profile.id)

  if(loading) return(
    <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:12,animation:'heartbeat 1.2s ease infinite'}}>💕</div>
        <div className="spin" style={{width:28,height:28,border:'3px solid #fde8e8',borderTopColor:'#f43f5e',borderRadius:'50%',margin:'0 auto'}}/>
      </div>
    </div>
  )

  return(
    <div style={{height:'100dvh',background:'#fafafa',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',maxWidth:480,margin:'0 auto'}}>

      {/* Welcome popup */}
      {welcome&&(
        <Overlay>
          <div style={{fontSize:56,marginBottom:10}}>🎉</div>
          <h2 style={{fontSize:21,fontWeight:900,color:'#111',marginBottom:5}}>You're all set!</h2>
          <p style={{color:'#888',fontSize:13,marginBottom:5}}>You got <strong style={{color:'#f43f5e'}}>10 free coins</strong> to start</p>
          <p style={{color:'#bbb',fontSize:12,marginBottom:20}}>Swipe right ❤️ to like · left to pass</p>
          <OBtn onClick={()=>setWelcome(false)}>Let's Go! 🎉</OBtn>
        </Overlay>
      )}

      {/* Daily coins */}
      {dailyCoins&&!welcome&&(
        <Overlay onClick={()=>setDailyCoins(null)}>
          <div style={{fontSize:48,marginBottom:8}}>🎁</div>
          <h2 style={{fontSize:18,fontWeight:900,color:'#111',marginBottom:10}}>Daily Reward!</h2>
          <div style={{background:'linear-gradient(135deg,#f43f5e,#ec4899)',borderRadius:14,padding:'12px 28px',marginBottom:16}}>
            <p style={{color:'#fff',fontSize:28,fontWeight:900,margin:0}}>+{dailyCoins.coins} 🪙</p>
            <p style={{color:'rgba(255,255,255,0.75)',fontSize:11,margin:'3px 0 0'}}>Day {dailyCoins.streak} streak</p>
          </div>
          <OBtn onClick={()=>setDailyCoins(null)}>Awesome! 🎉</OBtn>
        </Overlay>
      )}

      {/* Match popup */}
      {matchPop&&(
        <div style={{position:'fixed',inset:0,background:'linear-gradient(160deg,#f43f5e,#ec4899)',zIndex:999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:28,textAlign:'center'}}>
          <div style={{fontSize:68,marginBottom:10,animation:'pop 0.5s ease'}}>💞</div>
          <h2 style={{color:'#fff',fontSize:28,fontWeight:900,marginBottom:6,letterSpacing:'-0.5px'}}>It's a Match!</h2>
          <p style={{color:'rgba(255,255,255,0.85)',fontSize:15,marginBottom:24}}>You and <strong>{matchPop.full_name?.split(' ')[0]}</strong> liked each other</p>
          <div style={{display:'flex',gap:12,marginBottom:28}}>
            {[me?.avatar_url,matchPop.avatar_url].map((img:string,i:number)=>(
              <div key={i} style={{width:76,height:76,borderRadius:'50%',overflow:'hidden',border:'3px solid #fff',background:'rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:900,fontSize:20}}>
                {img?<img src={img} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:ini(i===0?me?.full_name||'?':matchPop.full_name)}
              </div>
            ))}
          </div>
          <button onClick={()=>{setMatchPop(null);router.push(`/chat/${matchPop.id}`)}}
            style={{width:'100%',maxWidth:300,padding:'15px',borderRadius:50,border:'none',background:'#fff',color:'#f43f5e',fontSize:15,fontWeight:900,marginBottom:10,boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
            💬 Send Message
          </button>
          <button onClick={()=>setMatchPop(null)}
            style={{background:'transparent',border:'2px solid rgba(255,255,255,0.45)',color:'#fff',borderRadius:50,padding:'13px',fontSize:14,fontWeight:600,width:'100%',maxWidth:300}}>
            Keep Swiping
          </button>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{background:'#fff',padding:'14px 20px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderBottom:'1px solid #f5f5f5'}}>
        <button onClick={()=>router.push('/dashboard')} style={{width:36,height:36,borderRadius:'50%',overflow:'hidden',border:'2.5px solid #f43f5e',background:'#f5f5f5',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
          {me?.avatar_url
            ?<img src={me.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
            :<span style={{fontSize:14,fontWeight:800,color:'#f43f5e'}}>{ini(me?.full_name||'?')}</span>
          }
        </button>
        <h1 style={{fontSize:17,fontWeight:900,color:'#111',letterSpacing:'-0.3px'}}>Discover</h1>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button onClick={()=>router.push('/notifications')} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'#f5f5f5',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>🔔</button>
          <button onClick={()=>router.push('/discover')} style={{width:34,height:34,borderRadius:'50%',border:'none',background:'#f5f5f5',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>⚡</button>
        </div>
      </div>

      {/* ── CARD STACK ── */}
      <div style={{flex:1,position:'relative',padding:'10px 12px 8px',overflow:'hidden'}}>

        {/* Card behind (next profile) */}
        {profiles[idx+1]&&(
          <div style={{position:'absolute',inset:'14px 18px 12px',borderRadius:24,overflow:'hidden',background:'#ddd',transform:'scale(0.93) translateY(16px)',zIndex:1,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            {profiles[idx+1].avatar_url&&<img src={profiles[idx+1].avatar_url} style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.55,filter:'blur(1px)'}} alt=""/>}
          </div>
        )}

        {/* Main swipe card */}
        {profile?(
          <div
            onMouseDown={e=>startDrag(e.clientX,e.clientY)}
            onMouseMove={e=>moveDrag(e.clientX,e.clientY)}
            onMouseUp={endDrag} onMouseLeave={endDrag}
            onTouchStart={e=>startDrag(e.touches[0].clientX,e.touches[0].clientY)}
            onTouchMove={e=>{e.preventDefault();moveDrag(e.touches[0].clientX,e.touches[0].clientY)}}
            onTouchEnd={endDrag}
            style={{
              position:'absolute',inset:'10px 12px 8px',
              borderRadius:24,overflow:'hidden',
              background:'#1a1a1a',
              zIndex:2,
              boxShadow:'0 12px 40px rgba(0,0,0,0.22)',
              transform:gone
                ?`translateX(${gone==='like'?'140%':'-140%'}) rotate(${gone==='like'?'25':'-25'}deg)`
                :`translateX(${dragX}px) translateY(${dragY}px) rotate(${rot}deg)`,
              transition:isDragging?'none':'transform 0.35s cubic-bezier(0.25,0.8,0.25,1)',
              cursor:isDragging?'grabbing':'grab',
              userSelect:'none',
              transformOrigin:'50% 85%',
            }}>

            {/* LIKE stamp */}
            {likeOp>0.05&&(
              <div style={{position:'absolute',top:32,left:20,zIndex:10,transform:'rotate(-22deg)',opacity:likeOp,pointerEvents:'none'}}>
                <div style={{border:'3px solid #22c55e',borderRadius:8,padding:'4px 14px',backdropFilter:'blur(4px)',background:'rgba(34,197,94,0.12)'}}>
                  <span style={{color:'#22c55e',fontWeight:900,fontSize:26,letterSpacing:2,textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>LIKE</span>
                </div>
              </div>
            )}
            {/* NOPE stamp */}
            {passOp>0.05&&(
              <div style={{position:'absolute',top:32,right:20,zIndex:10,transform:'rotate(22deg)',opacity:passOp,pointerEvents:'none'}}>
                <div style={{border:'3px solid #ef4444',borderRadius:8,padding:'4px 14px',backdropFilter:'blur(4px)',background:'rgba(239,68,68,0.12)'}}>
                  <span style={{color:'#ef4444',fontWeight:900,fontSize:26,letterSpacing:2,textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>NOPE</span>
                </div>
              </div>
            )}

            {/* Photo */}
            <div style={{position:'absolute',inset:0}}>
              {photos[photoIdx]
                ?<img src={photos[photoIdx]} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}} alt="" draggable={false}/>
                :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f43f5e,#ec4899)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,color:'#fff',fontWeight:900}}>{ini(profile.full_name)}</div>
              }
            </div>

            {/* Photo tap zones */}
            {photos.length>1&&<>
              <div style={{position:'absolute',top:0,left:0,width:'38%',height:'60%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.max(0,i-1))}}/>
              <div style={{position:'absolute',top:0,right:0,width:'38%',height:'60%',zIndex:5}} onClick={e=>{e.stopPropagation();setPhotoIdx(i=>Math.min(photos.length-1,i+1))}}/>
            </>}

            {/* Photo progress bars */}
            {photos.length>1&&(
              <div style={{position:'absolute',top:10,left:10,right:10,display:'flex',gap:3,zIndex:6,pointerEvents:'none'}}>
                {photos.map((_:any,i:number)=>(
                  <div key={i} style={{flex:1,height:3,borderRadius:2,background:i===photoIdx?'#fff':'rgba(255,255,255,0.3)',transition:'background 0.2s'}}/>
                ))}
              </div>
            )}

            {/* Dark gradient overlay */}
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.25) 45%,rgba(0,0,0,0.08) 70%,transparent 100%)',pointerEvents:'none'}}/>

            {/* Profile info */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'18px 18px 16px',pointerEvents:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <span style={{color:'#fff',fontSize:22,fontWeight:900,letterSpacing:'-0.3px',textShadow:'0 1px 4px rgba(0,0,0,0.4)'}}>
                  {profile.full_name?.split(' ')[0]}
                  {profile.age&&<span style={{fontWeight:400,marginLeft:6}}>{profile.age}</span>}
                </span>
                {profile.is_verified&&<div style={{width:18,height:18,borderRadius:'50%',background:'#3b82f6',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{color:'#fff',fontSize:9,fontWeight:900}}>✓</span></div>}
                {profile.is_premium&&<span style={{background:'#f97316',color:'#fff',fontSize:8,fontWeight:900,padding:'2px 6px',borderRadius:4,letterSpacing:'0.5px'}}>VIP</span>}
              </div>
              {profile.location_name&&(
                <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:6}}>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>📍 {profile.location_name}</span>
                </div>
              )}
              {profile.looking_for&&(
                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(6px)',color:'#fff',fontSize:11,padding:'4px 10px',borderRadius:50,fontWeight:600,border:'1px solid rgba(255,255,255,0.2)'}}>
                  {profile.looking_for==='relationship'?'💕 Dating':profile.looking_for==='friendship'?'🤝 Friends':profile.looking_for==='casual'?'😊 Casual':'🌐 Network'}
                </span>
              )}
            </div>

            {/* Info button */}
            <button onClick={e=>{e.stopPropagation();router.push(`/profile/${profile.id}`)}}
              style={{position:'absolute',bottom:16,right:14,width:32,height:32,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.4)',background:'rgba(0,0,0,0.3)',color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',zIndex:7,cursor:'pointer',backdropFilter:'blur(4px)'}}>
              ℹ
            </button>
          </div>
        ):(
          <div style={{position:'absolute',inset:'10px 12px 8px',borderRadius:24,background:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,zIndex:2,boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:60}}>🌍</div>
            <p style={{fontWeight:900,fontSize:17,color:'#111',marginBottom:2}}>You've seen everyone!</p>
            <p style={{color:'#94a3b8',fontSize:13}}>Check back soon</p>
            <button onClick={()=>{setIdx(0);setProfiles(p=>[...p])}} style={{marginTop:8,padding:'11px 26px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f43f5e,#ec4899)',color:'#fff',fontWeight:800,fontSize:14,boxShadow:'0 4px 14px rgba(244,63,94,0.35)'}}>
              🔄 Refresh
            </button>
          </div>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      {profile&&(
        <div style={{background:'#fff',padding:'12px 0 14px',display:'flex',alignItems:'center',justifyContent:'center',gap:18,flexShrink:0,borderTop:'1px solid #f5f5f5'}}>
          {/* Pass X */}
          <button onClick={doPass} style={{width:52,height:52,borderRadius:'50%',border:'none',background:'#fff',boxShadow:'0 3px 16px rgba(0,0,0,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,transition:'transform 0.12s'}}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.9)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'} onTouchStart={e=>e.currentTarget.style.transform='scale(0.9)'} onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}>
            ✕
          </button>
          {/* WhatsApp / Chat */}
          <button onClick={()=>router.push(`/chat/${profile.id}`)} style={{width:52,height:52,borderRadius:'50%',border:'none',background:'#22c55e',boxShadow:'0 4px 18px rgba(34,197,94,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,transition:'transform 0.12s'}}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.9)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'} onTouchStart={e=>e.currentTarget.style.transform='scale(0.9)'} onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}>
            💬
          </button>
          {/* Like heart */}
          <button onClick={doLike} style={{width:62,height:62,borderRadius:'50%',border:'none',background:`linear-gradient(135deg,#f43f5e,#ec4899)`,boxShadow:'0 6px 24px rgba(244,63,94,0.45)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,transition:'transform 0.12s'}}
            onMouseDown={e=>e.currentTarget.style.transform='scale(0.9)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'} onTouchStart={e=>e.currentTarget.style.transform='scale(0.9)'} onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}>
            {isLiked?'❤️':'🤍'}
          </button>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <div style={{background:'#fff',borderTop:'1px solid #f0f0f0',display:'flex',flexShrink:0,paddingBottom:'env(safe-area-inset-bottom)'}}>
        {[
          {icon:'🏠',label:'Home',path:'/home',active:true},
          {icon:'❤️',label:'Likes',path:'/discover',active:false},
          {icon:'💬',label:'Chat',path:'/chat',active:false,badge:unreadChat},
          {icon:'📞',label:'Contacts',path:'/discover',active:false},
          {icon:'👤',label:'Profile',path:'/dashboard',active:false},
        ].map(tab=>(
          <button key={tab.label} onClick={()=>router.push(tab.path)}
            style={{flex:1,padding:'10px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'none',border:'none',position:'relative'}}>
            <span style={{fontSize:18,lineHeight:1,filter:tab.active?'none':'grayscale(1)',opacity:tab.active?1:0.5}}>{tab.icon}</span>
            <span style={{fontSize:9,fontWeight:tab.active?700:500,color:tab.active?'#f43f5e':'#999',letterSpacing:'0.2px'}}>{tab.label}</span>
            {tab.active&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:3,height:3,borderRadius:'50%',background:'#f43f5e'}}/>}
            {(tab.badge||0)>0&&<div style={{position:'absolute',top:6,right:'calc(50% - 16px)',background:'#f43f5e',color:'#fff',fontSize:8,fontWeight:800,borderRadius:50,minWidth:14,height:14,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{(tab.badge||0)>9?'9+':tab.badge}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}

function Overlay({children,onClick}:any){
  return(
    <div onClick={onClick} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center',padding:24,backdropFilter:'blur(3px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:24,padding:'30px 24px',textAlign:'center',maxWidth:290,width:'100%',animation:'pop 0.3s ease',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        {children}
      </div>
    </div>
  )
}
function OBtn({children,onClick}:any){
  return<button onClick={onClick} style={{width:'100%',padding:'14px',borderRadius:50,border:'none',background:'linear-gradient(135deg,#f43f5e,#ec4899)',color:'#fff',fontSize:15,fontWeight:900,boxShadow:'0 4px 16px rgba(244,63,94,0.35)'}}>{children}</button>
}

export default function HomePage(){
  return(
    <Suspense fallback={<div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fff'}}><div style={{fontSize:48}}>💕</div></div>}>
      <HomeApp/>
    </Suspense>
  )
}
