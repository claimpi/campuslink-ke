'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function DashboardClient(){
  const router = useRouter()
  const sp = useSearchParams()
  const isNew = sp.get('new')==='true'
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ friends:0, following:0, followers:0, visitors:0, likes:0, matches:0, coins:0 })
  const [friendRequests, setFriendRequests] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [gifts, setGifts] = useState<any[]>([])

  useEffect(()=>{
    async function load(){
      const sb = createClient()
      const {data:{user}} = await sb.auth.getUser()
      if(!user){router.push('/login');return}
      setUser(user)

      const {data:p} = await sb.from('profiles').select('*').eq('id',user.id).maybeSingle()
      if(!p){
        const {data:np} = await sb.from('profiles').upsert({id:user.id,email:user.email,full_name:user.user_metadata?.full_name||user.email?.split('@')[0]||'User'},{onConflict:'id'}).select().maybeSingle()
        setProfile(np)
      } else setProfile(p)

      // Stats in parallel
      const [friendsRes, followingRes, followersRes, visitorsRes, likesRes, myLikesRes, coinsRes, reqRes, giftsRes] = await Promise.all([
        sb.from('friend_requests').select('id',{count:'exact',head:true}).or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).eq('status','accepted'),
        sb.from('follows').select('id',{count:'exact',head:true}).eq('follower_id',user.id),
        sb.from('follows').select('id',{count:'exact',head:true}).eq('following_id',user.id),
        sb.from('profiles').select('profile_views').eq('id',user.id).maybeSingle(),
        sb.from('likes').select('id',{count:'exact',head:true}).eq('receiver_id',user.id),
        sb.from('likes').select('receiver_id').eq('sender_id',user.id),
        sb.from('profiles').select('coins').eq('id',user.id).maybeSingle(),
        sb.from('friend_requests').select('id,sender_id').eq('receiver_id',user.id).eq('status','pending'),
        sb.from('gifts').select('id,gift_type,amount,created_at,profiles!gifts_sender_id_fkey(full_name,avatar_url)').eq('receiver_id',user.id).order('created_at',{ascending:false}).limit(5),
      ])

      // Compute matches
      const likedIds = (myLikesRes.data||[]).map((l:any)=>l.receiver_id)
      let matchCount = 0
      let matchProfiles:any[] = []
      if(likedIds.length>0){
        const {data:theyLiked} = await sb.from('likes').select('sender_id').eq('receiver_id',user.id).in('sender_id',likedIds)
        const matchIds = (theyLiked||[]).map((l:any)=>l.sender_id)
        matchCount = matchIds.length
        if(matchIds.length>0){
          const {data:mp} = await sb.from('profiles').select('id,full_name,avatar_url').in('id',matchIds).limit(8)
          matchProfiles = mp||[]
        }
      }
      setMatches(matchProfiles)

      // Friend requests with sender info
      if(reqRes.data&&reqRes.data.length>0){
        const sIds = reqRes.data.map((r:any)=>r.sender_id)
        const {data:senders} = await sb.from('profiles').select('id,full_name,avatar_url,location_name').in('id',sIds)
        setFriendRequests(reqRes.data.map((r:any)=>({...r,sender:senders?.find((s:any)=>s.id===r.sender_id)})))
      }

      setGifts(giftsRes.data||[])
      setStats({
        friends: friendsRes.count||0,
        following: followingRes.count||0,
        followers: followersRes.count||0,
        visitors: visitorsRes.data?.profile_views||0,
        likes: likesRes.count||0,
        matches: matchCount,
        coins: coinsRes.data?.coins||0,
      })
      setLoading(false)
    }
    load()
  },[])

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,border:'3px solid #fed7aa',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name = profile?.full_name||user?.email?.split('@')[0]||'User'
  const pct = [profile?.bio,profile?.location_name,(profile?.interests||[]).length>0,profile?.avatar_url,profile?.age].filter(Boolean).length*20

  return(
    <div style={{maxWidth:480,margin:'0 auto',background:'#f5f6fa',minHeight:'100vh',paddingBottom:80}}>

      {/* New user welcome */}
      {isNew&&(
        <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div>
            <p style={{color:'#fff',fontWeight:800,fontSize:14,margin:0}}>Welcome, {name.split(' ')[0]}! 🎉</p>
            <p style={{color:'rgba(255,255,255,0.85)',fontSize:12,margin:'2px 0 0'}}>Complete your profile to start connecting</p>
          </div>
          <Link href="/dashboard/profile" style={{background:'#fff',color:'#f97316',borderRadius:20,padding:'6px 14px',fontSize:12,fontWeight:800,textDecoration:'none',flexShrink:0}}>Complete</Link>
        </div>
      )}

      {/* Profile header card */}
      <div style={{background:'#fff',padding:'20px 16px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:16}}>
          {/* Avatar */}
          <div style={{position:'relative',flexShrink:0}}>
            <div style={{width:72,height:72,borderRadius:'50%',overflow:'hidden',border:profile?.is_premium?'3px solid #f59e0b':'2px solid #e2e8f0'}}>
              {profile?.avatar_url
                ?<img src={profile.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:900}}>{initials(name)}</div>
              }
            </div>
            <div style={{position:'absolute',bottom:2,right:2,width:12,height:12,borderRadius:'50%',background:'#22c55e',border:'2px solid #fff'}}/>
          </div>

          {/* Name & info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
              <span style={{fontSize:18,fontWeight:900,color:'#0f172a'}}>{name}</span>
              {profile?.is_verified&&<span style={{background:'#2563eb',color:'#fff',fontSize:9,padding:'2px 5px',borderRadius:4,fontWeight:700}}>✓</span>}
              {profile?.is_premium&&<span style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',color:'#fff',fontSize:9,padding:'2px 5px',borderRadius:4,fontWeight:700}}>VIP</span>}
            </div>
            <p style={{fontSize:12,color:'#94a3b8',margin:'0 0 4px'}}>ID:{profile?.id?.replace(/-/g,'').slice(0,9)||'...'}</p>
            {profile?.location_name&&<p style={{fontSize:12,color:'#64748b',margin:0}}>📍 {profile.location_name}</p>}
          </div>

          {/* Edit button */}
          <Link href="/dashboard/profile" style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid #e2e8f0',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none',flexShrink:0,fontSize:14}}>✏️</Link>
        </div>

        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',textAlign:'center',borderTop:'1px solid #f1f5f9',paddingTop:14,gap:4}}>
          {[
            {label:'Friends',value:stats.friends,href:null},
            {label:'Following',value:stats.following,href:null},
            {label:'Followers',value:stats.followers,href:null},
            {label:'Visitors',value:stats.visitors,href:null,badge:stats.visitors>0},
          ].map(s=>(
            <div key={s.label} style={{position:'relative'}}>
              {s.badge&&<div style={{position:'absolute',top:-2,right:'25%',width:7,height:7,borderRadius:'50%',background:'#ef4444'}}/>}
              <p style={{fontSize:20,fontWeight:900,color:'#0f172a',margin:0}}>{s.value}</p>
              <p style={{fontSize:11,color:'#94a3b8',margin:'2px 0 0',fontWeight:500}}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coin balance + VIP card */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,padding:'10px 12px'}}>
        <div onClick={()=>router.push('/pricing')} style={{background:'linear-gradient(135deg,#f97316,#fb923c)',borderRadius:16,padding:'16px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-10,right:-10,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.15)'}}/>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <span style={{fontSize:22}}>🪙</span>
            <span style={{fontSize:26,fontWeight:900,color:'#fff'}}>{stats.coins}</span>
          </div>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.85)',margin:0,fontWeight:600}}>Your Coins · Tap to buy</p>
        </div>
        <div onClick={()=>router.push('/pricing')} style={{background:'linear-gradient(135deg,#1e1b4b,#312e81)',borderRadius:16,padding:'16px',cursor:'pointer',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-10,right:-10,width:60,height:60,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <p style={{fontSize:13,fontWeight:900,color:'#fbbf24',margin:'0 0 2px'}}>VIP / SVIP</p>
          <p style={{fontSize:11,color:'rgba(255,255,255,0.7)',margin:'0 0 8px'}}>{profile?.is_premium?'Active member':'Unlock premium'}</p>
          <div style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:8,padding:'4px 10px',display:'inline-block'}}>
            <span style={{fontSize:10,fontWeight:800,color:'#fff'}}>{profile?.is_premium?'✓ ACTIVE':'UPGRADE →'}</span>
          </div>
        </div>
      </div>

      {/* Profile completeness */}
      {pct<100&&(
        <div style={{background:'#fff',margin:'0 12px 10px',borderRadius:14,padding:'14px 16px',border:'1px solid #e8ecf0'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <p style={{fontSize:13,fontWeight:700,color:'#0f172a',margin:0}}>Profile Completeness</p>
            <p style={{fontSize:13,fontWeight:800,color:'#f97316',margin:0}}>{pct}%</p>
          </div>
          <div style={{background:'#f1f5f9',borderRadius:50,height:6,overflow:'hidden',marginBottom:10}}>
            <div style={{height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:50,width:`${pct}%`,transition:'width 0.5s'}}/>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
            {[{l:'Photo',d:!!profile?.avatar_url},{l:'Bio',d:!!profile?.bio},{l:'Age',d:!!profile?.age},{l:'Location',d:!!profile?.location_name},{l:'Interests',d:(profile?.interests||[]).length>0}].map(x=>(
              <span key={x.l} style={{fontSize:11,padding:'3px 9px',borderRadius:50,background:x.d?'#f0fdf4':'#fef2f2',color:x.d?'#16a34a':'#ef4444',border:`1px solid ${x.d?'#bbf7d0':'#fecaca'}`,fontWeight:600}}>
                {x.d?'✓':'+'} {x.l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Likes & Matches */}
      <div style={{background:'#fff',margin:'0 12px 10px',borderRadius:14,padding:'14px 16px',border:'1px solid #e8ecf0'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:matches.length>0?12:0}}>
          <div style={{background:'#fdf2f8',borderRadius:10,padding:'12px',textAlign:'center'}}>
            <p style={{fontSize:22,fontWeight:900,color:'#ec4899',margin:0}}>{stats.likes}</p>
            <p style={{fontSize:10,color:'#94a3b8',fontWeight:600,margin:'3px 0 0'}}>PEOPLE LIKED YOU</p>
          </div>
          <div style={{background:'#fdf2f8',borderRadius:10,padding:'12px',textAlign:'center'}}>
            <p style={{fontSize:22,fontWeight:900,color:'#be185d',margin:0}}>{stats.matches}</p>
            <p style={{fontSize:10,color:'#94a3b8',fontWeight:600,margin:'3px 0 0'}}>MUTUAL MATCHES</p>
          </div>
        </div>
        {matches.length>0&&(
          <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:4}}>
            {matches.map((m:any)=>(
              <Link key={m.id} href={`/profile/${m.id}`} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none',flexShrink:0}}>
                <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',border:'2px solid #ec4899'}}>
                  {m.avatar_url?<img src={m.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                    :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#ec4899,#be185d)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{initials(m.full_name)}</div>}
                </div>
                <p style={{fontSize:10,color:'#374151',fontWeight:600,margin:0}}>{m.full_name?.split(' ')[0]}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,padding:'0 12px',marginBottom:10}}>
        {[
          {href:'/discover',icon:'🔍',label:'Discover'},
          {href:'/chat',icon:'💬',label:'Messages'},
          {href:'/dashboard/profile',icon:'✏️',label:'Edit Profile'},
        ].map(a=>(
          <Link key={a.href} href={a.href} style={{background:'#fff',borderRadius:14,padding:'14px 8px',textAlign:'center',textDecoration:'none',border:'1px solid #e8ecf0'}}>
            <div style={{fontSize:24,marginBottom:4}}>{a.icon}</div>
            <p style={{fontSize:11,fontWeight:700,color:'#374151',margin:0}}>{a.label}</p>
          </Link>
        ))}
      </div>

      {/* Friend Requests */}
      {friendRequests.length>0&&(
        <div style={{background:'#fff',margin:'0 12px 10px',borderRadius:14,padding:'14px 16px',border:'1px solid #e8ecf0'}}>
          <p style={{fontSize:14,fontWeight:800,color:'#0f172a',margin:'0 0 12px',display:'flex',alignItems:'center',gap:8}}>
            Friend Requests
            <span style={{background:'#f97316',color:'#fff',fontSize:10,padding:'2px 7px',borderRadius:50,fontWeight:700}}>{friendRequests.length}</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {friendRequests.map((req:any)=>(
              <div key={req.id} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:40,height:40,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:'2px solid #e2e8f0'}}>
                  {req.sender?.avatar_url?<img src={req.sender.avatar_url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                    :<div style={{width:'100%',height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14}}>{initials(req.sender?.full_name||'?')}</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:13,color:'#0f172a',margin:0}}>{req.sender?.full_name}</p>
                  <p style={{fontSize:11,color:'#94a3b8',margin:'1px 0 0'}}>{req.sender?.location_name||'Kenya'}</p>
                </div>
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button onClick={async()=>{
                    await createClient().from('friend_requests').update({status:'accepted'}).eq('id',req.id)
                    setFriendRequests(fr=>fr.filter(r=>r.id!==req.id))
                    setStats(s=>({...s,friends:s.friends+1}))
                  }} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>✓ Accept</button>
                  <button onClick={async()=>{
                    await createClient().from('friend_requests').update({status:'declined'}).eq('id',req.id)
                    setFriendRequests(fr=>fr.filter(r=>r.id!==req.id))
                  }} style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gifts */}
      {gifts.length>0&&(
        <div style={{background:'#fff',margin:'0 12px 10px',borderRadius:14,padding:'14px 16px',border:'1px solid #fce7f3'}}>
          <p style={{fontSize:14,fontWeight:800,color:'#be185d',margin:'0 0 12px'}}>🎁 Gifts Received</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {gifts.map((g:any)=>(
              <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,background:'#fdf2f8',borderRadius:10,padding:'10px 12px'}}>
                <span style={{fontSize:22,flexShrink:0}}>
                  {g.gift_type==='rose'?'🌹':g.gift_type==='heart'?'💝':g.gift_type==='star'?'⭐':g.gift_type==='crown'?'👑':'💎'}
                </span>
                <div style={{flex:1}}>
                  <p style={{fontSize:12,fontWeight:700,color:'#be185d',margin:0}}>{(g.profiles as any)?.full_name||'Someone'} sent you a {g.gift_type}</p>
                  <p style={{fontSize:10,color:'#94a3b8',margin:'2px 0 0'}}>{new Date(g.created_at).toLocaleDateString()}</p>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:'#ec4899',flexShrink:0}}>🪙 {g.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral - earn coins */}
      {profile?.referral_code&&(
        <div style={{background:'#fff',margin:'0 12px 10px',borderRadius:14,padding:'14px 16px',border:'1px solid #e8ecf0'}}>
          <p style={{fontSize:14,fontWeight:800,color:'#0f172a',margin:'0 0 4px'}}>🪙 Earn Coins</p>
          <p style={{fontSize:12,color:'#94a3b8',margin:'0 0 12px'}}>Invite friends · earn <strong style={{color:'#f97316'}}>50 coins</strong> per referral · use coins to chat</p>
          <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:10,padding:'12px',marginBottom:12}}>
            <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:8}}>
              {[
                {icon:'👥',label:'Invite friend',coins:'+50 🪙'},
                {icon:'💬',label:'They join',coins:'you earn'},
                {icon:'🎁',label:'Use coins',coins:'to chat'},
              ].map(s=>(
                <div key={s.label} style={{textAlign:'center',flex:1}}>
                  <div style={{fontSize:22,marginBottom:3}}>{s.icon}</div>
                  <p style={{fontSize:10,color:'#374151',fontWeight:700,margin:0}}>{s.label}</p>
                  <p style={{fontSize:10,color:'#f97316',fontWeight:700,margin:'2px 0 0'}}>{s.coins}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 12px',fontSize:12,color:'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              campuslink.co.ke/ref/{profile.referral_code}
            </div>
            <button onClick={()=>{
              navigator.clipboard.writeText(`https://campuslink.co.ke/ref/${profile.referral_code}`)
              alert('Referral link copied! Share it to earn 50 coins per signup 🪙')
            }} style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:8,padding:'9px 16px',fontSize:12,fontWeight:700,cursor:'pointer',flexShrink:0}}>
              Copy Link
            </button>
          </div>
          {/* Share button */}
          <button onClick={()=>{
            if(navigator.share){
              navigator.share({title:'Join CampusLink KE',text:'Meet people near you! Use my referral link to join free 🎉',url:`https://campuslink.co.ke/ref/${profile.referral_code}`})
            } else {
              navigator.clipboard.writeText(`https://campuslink.co.ke/ref/${profile.referral_code}`)
              alert('Link copied!')
            }
          }} style={{width:'100%',marginTop:8,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'9px',fontSize:13,fontWeight:700,color:'#16a34a',cursor:'pointer'}}>
            📤 Share Link
          </button>
        </div>
      )}

      {/* Upgrade nudge */}
      {!profile?.is_premium&&(
        <div onClick={()=>router.push('/pricing')} style={{background:'linear-gradient(135deg,#1e1b4b,#312e81)',margin:'0 12px 10px',borderRadius:14,padding:'16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div>
            <p style={{color:'#fbbf24',fontWeight:800,fontSize:14,margin:'0 0 3px'}}>👑 Upgrade to VIP</p>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:12,margin:0}}>Get verified, featured & more</p>
          </div>
          <div style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:20,padding:'7px 16px',flexShrink:0}}>
            <span style={{color:'#fff',fontSize:12,fontWeight:800}}>KES 299 →</span>
          </div>
        </div>
      )}
    </div>
  )
}
