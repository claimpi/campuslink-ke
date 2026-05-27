'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

export default function DashboardClient(){
  const router=useRouter()
  const sp=useSearchParams()
  const isWelcome=sp.get('welcome')==='true'
  const [user,setUser]=useState<any>(null)
  const [profile,setProfile]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [friendRequests,setFriendRequests]=useState<any[]>([])

  useEffect(()=>{
    async function load(){
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user){router.push('/login');return}
      setUser(user)
      const {data}=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle()
      if(!data){
        const {data:np}=await sb.from('profiles').upsert({id:user.id,email:user.email,full_name:user.user_metadata?.full_name||user.email?.split('@')[0]||'Student'},{onConflict:'id'}).select().maybeSingle()
        setProfile(np)
      } else setProfile(data)

      // Load pending friend requests sent TO this user
      const {data:requests} = await sb.from('friend_requests')
        .select('id,sender_id,status')
        .eq('receiver_id', user.id)
        .eq('status','pending')
      
      if(requests && requests.length > 0) {
        // Get sender profiles
        const senderIds = requests.map((r:any)=>r.sender_id)
        const {data:senders} = await sb.from('profiles')
          .select('id,full_name,university,course,avatar_url,whatsapp_number,bio,interests,is_premium,is_featured,is_top_student,profile_views,referral_code,referral_earnings')
          .in('id', senderIds)
        const mapped = requests.map((r:any)=>({
          ...r,
          sender: senders?.find((s:any)=>s.id===r.sender_id)
        }))
        setFriendRequests(mapped)
      }
      setLoading(false)
    }
    load()
  },[])

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh'}}>
      <div style={{width:'36px',height:'36px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name=profile?.full_name||user?.email?.split('@')[0]||'Student'
  const pct=[profile?.bio,profile?.whatsapp_number,profile?.university,profile?.course,(profile?.interests||[]).length>0].filter(Boolean).length*20

  return(
    <div style={{maxWidth:'1000px',margin:'0 auto',padding:'32px 20px'}}>
      {isWelcome&&(
        <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'16px',padding:'20px 24px',marginBottom:'24px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <p style={{fontWeight:'800',fontSize:'18px',marginBottom:'3px'}}>Welcome, {name.split(' ')[0]}!</p>
            <p style={{fontSize:'13px',opacity:0.9}}>Complete your profile to appear in search results.</p>
          </div>
          <Link href="/dashboard/profile" style={{background:'#fff',color:'#f97316',padding:'9px 20px',borderRadius:'8px',fontWeight:'700',fontSize:'13px'}}>Complete Profile</Link>
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          {profile?.avatar_url
            ?<img src={profile.avatar_url} style={{width:'52px',height:'52px',borderRadius:'50%',objectFit:'cover',border:'2px solid #e2e8f0'}}/>
            :<div style={{width:'52px',height:'52px',borderRadius:'50%',background:'linear-gradient(135deg,#fff7ed,#fed7aa)',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'18px',border:'2px solid #fed7aa'}}>{initials(name)}</div>
          }
          <div>
            <h1 style={{fontSize:'20px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>Hi, {name.split(' ')[0]}</h1>
            <p style={{color:'#94a3b8',fontSize:'13px'}}>{profile?.university||'Add your university'}</p>
          </div>
        </div>
        <Link href="/dashboard/profile" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'10px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}}>Edit Profile</Link>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:'12px',marginBottom:'24px'}}>
        {[
          {label:'Views',value:profile?.profile_views||0,bg:'#fff7ed',color:'#ea580c'},
          {label:'Status',value:profile?.is_premium?'Premium':'Free',bg:'#f5f3ff',color:'#7c3aed'},
          {label:'Featured',value:profile?.is_featured?'Yes':'No',bg:'#fefce8',color:'#ca8a04'},
          {label:'Top Student',value:profile?.is_top_student?'Yes':'No',bg:'#f0fdf4',color:'#16a34a'},
        ].map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'16px'}}>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#0f172a',marginBottom:'2px'}}>{String(s.value)}</div>
            <div style={{fontSize:'12px',color:'#94a3b8'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Completeness */}
      <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
          <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>Profile Completeness</p>
          <p style={{fontWeight:'700',color:'#f97316',fontSize:'14px'}}>{pct}%</p>
        </div>
        <div style={{background:'#f1f5f9',borderRadius:'50px',height:'6px',overflow:'hidden',marginBottom:'12px'}}>
          <div style={{height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'50px',width:`${pct}%`,transition:'width 0.5s'}}/>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          {[{l:'University',d:!!profile?.university},{l:'Course',d:!!profile?.course},{l:'WhatsApp',d:!!profile?.whatsapp_number},{l:'Bio',d:!!profile?.bio},{l:'Interests',d:(profile?.interests||[]).length>0},{l:'Photo',d:!!profile?.avatar_url}].map(x=>(
            <span key={x.l} style={{fontSize:'12px',padding:'3px 9px',borderRadius:'50px',background:x.d?'#f0fdf4':'#f8fafc',color:x.d?'#16a34a':'#94a3b8',border:`1px solid ${x.d?'#bbf7d0':'#e2e8f0'}`,fontWeight:'600'}}>{x.d?'✓':' '} {x.l}</span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px',marginBottom:'20px'}}>
        {[{href:'/dashboard/profile',t:'Edit Profile',d:'Update info & photo'},{href:'/discover',t:'Browse Students',d:'Find connections'},{href:'/groups',t:'WhatsApp Groups',d:'Join group chats'},{href:'/pricing',t:'Upgrade',d:'Premium & badges'}].map(a=>(
          <Link key={a.href} href={a.href} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'18px',display:'block'}}>
            <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'3px'}}>{a.t}</p>
            <p style={{fontSize:'12px',color:'#94a3b8'}}>{a.d}</p>
          </Link>
        ))}
      </div>

      {/* Profile photo nudge */}
      {!profile?.avatar_url&&(
        <div style={{background:'linear-gradient(135deg,#fff7ed,#fef3c7)',border:'1px solid #fde68a',borderRadius:'14px',padding:'16px 20px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
          <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>📸</div>
          <div style={{flex:1,minWidth:'180px'}}>
            <p style={{fontWeight:'700',color:'#92400e',fontSize:'14px',marginBottom:'2px'}}>Add a profile photo!</p>
            <p style={{fontSize:'12px',color:'#a16207'}}>Students with photos get <strong>3x more</strong> connection requests</p>
          </div>
          <a href="/dashboard/profile" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'9px 18px',borderRadius:'9px',fontSize:'13px',fontWeight:'700',textDecoration:'none',flexShrink:0,boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}}>
            Add Photo →
          </a>
        </div>
      )}

      {/* WhatsApp nudge */}
      {!profile?.whatsapp_number&&(
        <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'14px',padding:'14px 20px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
          <span style={{fontSize:'22px',flexShrink:0}}>💬</span>
          <div style={{flex:1,minWidth:'180px'}}>
            <p style={{fontWeight:'700',color:'#166534',fontSize:'14px',marginBottom:'2px'}}>Add your WhatsApp number</p>
            <p style={{fontSize:'12px',color:'#16a34a'}}>So students who connect with you can reach you</p>
          </div>
          <a href="/dashboard/profile" style={{background:'#16a34a',color:'#fff',padding:'9px 18px',borderRadius:'9px',fontSize:'13px',fontWeight:'700',textDecoration:'none',flexShrink:0}}>
            Add Now →
          </a>
        </div>
      )}

      {/* Friend Requests */}
      {friendRequests.length>0&&(
        <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',marginBottom:'16px'}}>
          <p style={{fontWeight:'700',color:'#0f172a',fontSize:'15px',marginBottom:'14px'}}>
            Friend Requests <span style={{background:'#f97316',color:'#fff',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',marginLeft:'6px'}}>{friendRequests.length}</span>
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {friendRequests.map((req:any)=>(
              <div key={req.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'#fff7ed',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'14px',flexShrink:0}}>
                    {(req.sender?.full_name||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <p style={{fontWeight:'600',color:'#0f172a',fontSize:'14px'}}>{req.sender?.full_name}</p>
                    <p style={{fontSize:'12px',color:'#94a3b8'}}>{req.sender?.university}</p>
                    <a href={`/profile/${req.sender_id}`} target="_blank" rel="noopener noreferrer"
                      style={{fontSize:'12px',color:'#f97316',fontWeight:'600',textDecoration:'none'}}>
                      View Profile →
                    </a>
                  </div>
                </div>
                <div style={{display:'flex',gap:'6px'}}>
                  <button onClick={async()=>{
                    await createClient().from('friend_requests').update({status:'accepted'}).eq('id',req.id)
                    setFriendRequests(fr=>fr.filter(r=>r.id!==req.id))
                  }} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:'8px',padding:'7px 14px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Accept</button>
                  <button onClick={async()=>{
                    await createClient().from('friend_requests').update({status:'declined'}).eq('id',req.id)
                    setFriendRequests(fr=>fr.filter(r=>r.id!==req.id))
                  }} style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',borderRadius:'8px',padding:'7px 14px',fontSize:'13px',fontWeight:'700',cursor:'pointer'}}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral Section */}
      {profile?.referral_code&&(
        <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',marginBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',marginBottom:'14px'}}>
            <div>
              <p style={{fontWeight:'700',color:'#0f172a',fontSize:'15px',marginBottom:'2px'}}>Your Referral Link</p>
              <p style={{fontSize:'12px',color:'#94a3b8'}}>Earn KES 10 for every student who joins using your link</p>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'8px 16px',textAlign:'center'}}>
                <p style={{fontSize:'20px',fontWeight:'900',color:'#16a34a',lineHeight:'1'}}>KES {profile?.referral_earnings||0}</p>
                <p style={{fontSize:'11px',color:'#16a34a',fontWeight:'600'}}>Earnings</p>
              </div>
              <button onClick={()=>{
                createClient().from('profiles').select('referral_earnings').eq('id',user?.id).maybeSingle()
                  .then(({data})=>{ if(data) setProfile((p:any)=>({...p,referral_earnings:data.referral_earnings})) })
              }} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'6px 10px',fontSize:'12px',cursor:'pointer',color:'#64748b',fontWeight:'600'}}>Refresh</button>
            </div>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <div style={{flex:1,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#0f172a',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              campuslink.co.ke/ref/{profile.referral_code}
            </div>
            <button onClick={()=>{navigator.clipboard.writeText(`https://campuslink.co.ke/ref/${profile.referral_code}`);alert('Link copied!')}}
              style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'10px 18px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',border:'none',cursor:'pointer',flexShrink:0}}>
              Copy
            </button>
          </div>
          {(profile.referral_earnings||0) > 0 && (
            <div style={{marginTop:'12px',background:'#f0fdf4',borderRadius:'8px',padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <p style={{fontSize:'13px',color:'#16a34a',fontWeight:'600'}}>You have KES {profile.referral_earnings} in earnings</p>
              <a href={`https://wa.me/254790166252?text=Hello%20CampusLink%20KE%2C%20I%20want%20to%20withdraw%20my%20referral%20earnings%20of%20KES%20${profile.referral_earnings}.%20My%20referral%20code%20is%20${profile.referral_code}`}
                target="_blank" rel="noopener noreferrer"
                style={{background:'#16a34a',color:'#fff',padding:'7px 14px',borderRadius:'7px',fontSize:'12px',fontWeight:'700'}}>
                Withdraw via WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {!profile?.is_premium&&(
        <div style={{background:'#0f172a',borderRadius:'14px',padding:'20px 24px',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <p style={{fontWeight:'700',fontSize:'16px',marginBottom:'3px'}}>Upgrade to Premium — KES 199/month</p>
            <p style={{fontSize:'13px',color:'#94a3b8'}}>Unlimited unlocks, premium badge, analytics</p>
          </div>
          <Link href="/pricing" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'10px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',flexShrink:0}}>Upgrade</Link>
        </div>
      )}
    </div>
  )
}
