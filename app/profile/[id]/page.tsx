'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

type FriendStatus = 'none'|'pending_sent'|'pending_received'|'friends'

export default function ProfilePage(){
  const {id}=useParams()
  const router=useRouter()
  const [profile,setProfile]=useState<any>(null)
  const [currentUser,setCurrentUser]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [paying,setPaying]=useState(false)
  const [activePhoto,setActivePhoto]=useState<string|null>(null)
  const [friendStatus,setFriendStatus]=useState<FriendStatus>('none')
  const [requestId,setRequestId]=useState<string|null>(null)
  const [friendLoading,setFriendLoading]=useState(false)
  const [copied,setCopied]=useState(false)

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      setCurrentUser(user)
      if(user && user.id !== id){
        // Check friend request status
        sb.from('friend_requests').select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`)
          .maybeSingle()
          .then(({data})=>{
            if(!data){ setFriendStatus('none'); return }
            setRequestId(data.id)
            if(data.status==='accepted') setFriendStatus('friends')
            else if(data.sender_id===user.id) setFriendStatus('pending_sent')
            else setFriendStatus('pending_received')
          })
      }
    })
    sb.from('profiles').select('*').eq('id',id as string).maybeSingle().then(({data})=>{
      setProfile(data)
      setLoading(false)
      if(data) sb.from('profiles').update({profile_views:(data.profile_views||0)+1}).eq('id',id as string)
    })
  },[id])

  async function sendFriendRequest(){
    if(!currentUser){router.push('/login');return}
    setFriendLoading(true)
    const sb=createClient()
    const {data,error}=await sb.from('friend_requests').insert([{
      sender_id:currentUser.id, receiver_id:id, status:'pending'
    }]).select().single()
    if(!error){
      setFriendStatus('pending_sent')
      setRequestId(data.id)
      // Send push notification
      const {data:me}=await sb.from('profiles').select('full_name').eq('id',currentUser.id).maybeSingle()
      fetch('/api/push-notify',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          userId:id,
          title:'New Friend Request ',
          body:`${me?.full_name||'Someone'} wants to connect with you on CampusLink KE`,
          url:'/dashboard'
        })
      }).then(r=>r.json()).then(d=>console.log('Push:',d)).catch(()=>{})
    }
    setFriendLoading(false)
  }

  async function cancelRequest(){
    if(!requestId) return
    setFriendLoading(true)
    await createClient().from('friend_requests').delete().eq('id',requestId)
    setFriendStatus('none');setRequestId(null)
    setFriendLoading(false)
  }

  async function acceptRequest(){
    if(!requestId) return
    setFriendLoading(true)
    await createClient().from('friend_requests').update({status:'accepted'}).eq('id',requestId)
    setFriendStatus('friends')
    setFriendLoading(false)
  }

  async function declineRequest(){
    if(!requestId) return
    setFriendLoading(true)
    await createClient().from('friend_requests').update({status:'declined'}).eq('id',requestId)
    setFriendStatus('none');setRequestId(null)
    setFriendLoading(false)
  }

  async function handleUnlock(){
    if(!currentUser){router.push('/login');return}
    setPaying(true)
    try{
      const sb=createClient()
      const {data:curr}=await sb.from('profiles').select('full_name,whatsapp_number').eq('id',currentUser.id).maybeSingle()
      const res=await fetch('/api/pesapal',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:currentUser.id,userEmail:currentUser.email,userName:curr?.full_name||currentUser.email,
          phone:curr?.whatsapp_number||'',paymentType:'unlock',targetId:id})})
      const data=await res.json()
      if(data.redirectUrl) window.location.href=data.redirectUrl
      else{alert(data.error||'Payment failed');setPaying(false)}
    }catch{alert('Something went wrong');setPaying(false)}
  }

  function shareProfile(){
    const url=`https://www.campuslink.co.ke/profile/${id}`
    if(navigator.share) navigator.share({title:`${profile?.full_name} — CampusLink KE`,url})
    else{navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}
  }

  if(loading) return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{width:'32px',height:'32px',border:'3px solid #e2e8f0',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if(!profile) return(
    <div style={{textAlign:'center',padding:'80px 20px'}}>
      <p style={{fontSize:'18px',fontWeight:'700',color:'#0f172a',marginBottom:'8px'}}>Profile not found</p>
      <Link href="/" style={{color:'#f97316',fontSize:'14px'}}>← Back to students</Link>
    </div>
  )

  const photos=Array.isArray(profile.photos)?profile.photos.filter(Boolean):[]
  const interests=Array.isArray(profile.interests)?profile.interests.filter(Boolean):[]
  const isOwnProfile=currentUser?.id===id

  return(
    <div style={{maxWidth:'780px',margin:'0 auto',padding:'28px 20px'}}>
      <Link href="/" style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',display:'inline-block'}}>← Back to students</Link>

      <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',flexWrap:'wrap'}}>
          {/* Left */}
          <div style={{flex:'1',minWidth:'260px',padding:'28px'}}>
            <div style={{display:'flex',gap:'16px',alignItems:'flex-start',marginBottom:'16px'}}>
              <div style={{position:'relative',flexShrink:0}}>
                {profile.avatar_url
                  ?<img src={profile.avatar_url} style={{width:'80px',height:'80px',borderRadius:'14px',objectFit:'cover',border:'1px solid #e2e8f0'}}/>
                  :<div style={{width:'80px',height:'80px',borderRadius:'14px',background:'#f8fafc',color:'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'24px',border:'1px solid #e2e8f0'}}>{initials(profile.full_name)}</div>
                }
                              </div>
              <div style={{paddingTop:'4px'}}>
                <h1 style={{fontSize:'20px',fontWeight:'800',color:'#0f172a',marginBottom:'5px',lineHeight:'1.2'}}>{profile.full_name}</h1>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
                  {profile.is_top_student&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #fed7aa'}}>Top Student</span>}
                  {profile.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #ddd6fe'}}>Premium</span>}
                  {profile.is_featured&&<span style={{background:'#fff7ed',color:'#f97316',fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',border:'1px solid #fed7aa'}}>Featured</span>}
                  {profile.status&&<span style={{fontSize:'11px',padding:'3px 8px',borderRadius:'6px',fontWeight:'700',
                    background:profile.status==='single'?'#f0fdf4':profile.status==='taken'?'#fef2f2':'#fff7ed',
                    color:profile.status==='single'?'#16a34a':profile.status==='taken'?'#dc2626':'#ea580c',
                    border:`1px solid ${profile.status==='single'?'#bbf7d0':profile.status==='taken'?'#fecaca':'#fed7aa'}`}}>
                    {profile.status==='single'?' Single':profile.status==='taken'?' Taken':' Complicated'}
                  </span>}
                </div>
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
              {profile.course&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Course</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.course}</span></div>}
              {profile.university&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>University</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.university}</span></div>}
              {profile.year_of_study&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Year</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>Year {profile.year_of_study}</span></div>}
              {profile.age&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Age</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.age} years</span></div>}
              {profile.gender&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Gender</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500',textTransform:'capitalize'}}>{profile.gender}</span></div>}
              {profile.location_name&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Location</span><span style={{fontSize:'13px',color:'#f97316',fontWeight:'500'}}> {profile.location_name}</span></div>}
              {profile.looking_for&&<div style={{display:'flex',gap:'10px'}}><span style={{fontSize:'12px',color:'#94a3b8',width:'70px',flexShrink:0}}>Looking</span><span style={{fontSize:'13px',color:'#374151',fontWeight:'500'}}>{profile.looking_for==='friendship'?' Friendship':profile.looking_for==='relationship'?' Relationship':profile.looking_for==='study'?' Study Partner':' Networking'}</span></div>}
            </div>

            {interests.length>0&&(
              <div style={{marginBottom:'14px'}}>
                <p style={{fontSize:'11px',color:'#94a3b8',marginBottom:'6px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'}}>Interests</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
                  {interests.map((i:string)=><span key={i} style={{background:'#f8fafc',color:'#475569',fontSize:'12px',padding:'3px 9px',borderRadius:'6px',border:'1px solid #e2e8f0'}}>{i}</span>)}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(profile.tiktok||profile.instagram)&&(
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
                {profile.tiktok&&(
                  <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'flex',alignItems:'center',gap:'5px',background:'#000',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
                    TikTok
                  </a>
                )}
                {profile.instagram&&(
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    style={{display:'flex',alignItems:'center',gap:'5px',background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                )}
              </div>
            )}
            <p style={{fontSize:'12px',color:'#cbd5e1',marginBottom:'12px'}}>{profile.profile_views||0} profile views</p>

            {/* Share buttons */}
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              <button onClick={shareProfile} style={{display:'flex',alignItems:'center',gap:'5px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:'600',color:'#374151',cursor:'pointer'}}>
                {copied?' Copied':' Share'}
              </button>
              <a href={`https://wa.me/?text=Connect%20with%20${encodeURIComponent(profile.full_name)}%20on%20CampusLink%20KE%20https://www.campuslink.co.ke/profile/${id}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:'flex',alignItems:'center',gap:'5px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',fontWeight:'600',color:'#16a34a'}}>
                 Share
              </a>
            </div>
          </div>

          {/* Right */}
          <div style={{flex:'1',minWidth:'260px',padding:'28px',borderLeft:'1px solid #f1f5f9',background:'#fafafa'}}>
            {profile.bio&&(
              <div style={{marginBottom:'20px'}}>
                <p style={{fontSize:'11px',color:'#94a3b8',marginBottom:'8px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px'}}>About</p>
                <p style={{fontSize:'14px',color:'#374151',lineHeight:'1.7'}}>{profile.bio}</p>
              </div>
            )}

            {/* Friend Request / Connect Box */}
            {!isOwnProfile && (
              <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:'18px',marginBottom:'12px'}}>
                {friendStatus==='none'&&(
                  <>
                    <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>Connect with {profile.full_name?.split(' ')[0]}</p>
                    <p style={{fontSize:'12px',color:'#64748b',marginBottom:'14px',lineHeight:'1.5'}}>Send a friend request first. Once accepted, you can unlock their WhatsApp number.</p>
                    <button onClick={sendFriendRequest} disabled={friendLoading}
                      style={{width:'100%',background:friendLoading?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:friendLoading?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}}>
                      {friendLoading?'Sending...':' Send Friend Request'}
                    </button>
                  </>
                )}

                {friendStatus==='pending_sent'&&(
                  <>
                    <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>Request Sent</p>
                    <p style={{fontSize:'12px',color:'#64748b',marginBottom:'14px'}}>Waiting for {profile.full_name?.split(' ')[0]} to accept your request.</p>
                    <div style={{background:'#fefce8',border:'1px solid #fde68a',borderRadius:'10px',padding:'10px 14px',marginBottom:'12px',fontSize:'13px',color:'#92400e',fontWeight:'600',textAlign:'center'}}> Request Pending</div>
                    <button onClick={cancelRequest} disabled={friendLoading}
                      style={{width:'100%',background:'#fff',border:'1px solid #e2e8f0',color:'#64748b',padding:'10px',borderRadius:'10px',fontWeight:'600',fontSize:'13px',cursor:'pointer'}}>
                      Cancel Request
                    </button>
                  </>
                )}

                {friendStatus==='pending_received'&&(
                  <>
                    <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>{profile.full_name?.split(' ')[0]} wants to connect!</p>
                    <p style={{fontSize:'12px',color:'#64748b',marginBottom:'14px'}}>Accept to allow them to unlock your WhatsApp number.</p>
                    <div style={{display:'flex',gap:'8px'}}>
                      <button onClick={acceptRequest} disabled={friendLoading}
                        style={{flex:1,background:'linear-gradient(135deg,#16a34a,#15803d)',color:'#fff',padding:'11px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer'}}>
                         Accept
                      </button>
                      <button onClick={declineRequest} disabled={friendLoading}
                        style={{flex:1,background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'11px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',cursor:'pointer'}}>
                         Decline
                      </button>
                    </div>
                  </>
                )}

                {friendStatus==='friends'&&(
                  <>
                    <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',fontSize:'13px',color:'#16a34a',fontWeight:'700',textAlign:'center'}}>
                       You are connected with {profile.full_name?.split(' ')[0]}
                    </div>
                    <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>Unlock WhatsApp Number</p>
                    <p style={{fontSize:'12px',color:'#64748b',marginBottom:'14px'}}>Pay KES 20 via M-Pesa to see their number.</p>
                    <button onClick={handleUnlock} disabled={paying}
                      style={{width:'100%',background:paying?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:paying?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}}>
                      {paying?'Redirecting...':' Unlock for KES 20'}
                    </button>
                  </>
                )}
              </div>
            )}

            {isOwnProfile&&(
              <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'14px',textAlign:'center'}}>
                <p style={{fontSize:'13px',color:'#16a34a',fontWeight:'600',marginBottom:'8px'}}>This is your profile</p>
                <Link href="/dashboard/profile" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:'700'}}>Edit Profile</Link>
              </div>
            )}
          </div>
        </div>

        {/* Gallery */}
        {photos.length>0&&(
          <div style={{padding:'0 28px 28px',borderTop:'1px solid #f1f5f9'}}>
            <p style={{fontSize:'11px',color:'#94a3b8',marginBottom:'12px',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.4px',paddingTop:'20px'}}>Photos ({photos.length})</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'8px'}}>
              {photos.map((url:string,i:number)=>(
                <div key={i} onClick={()=>setActivePhoto(url)} style={{aspectRatio:'1',borderRadius:'10px',overflow:'hidden',cursor:'pointer',border:'1px solid #e2e8f0'}}>
                  <img src={url} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.2s'}}
                    onMouseEnter={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1.05)'}
                    onMouseLeave={e=>(e.currentTarget as HTMLImageElement).style.transform='scale(1)'}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {activePhoto&&(
        <div onClick={()=>setActivePhoto(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'20px',cursor:'pointer'}}>
          <img src={activePhoto} style={{maxWidth:'90vw',maxHeight:'90vh',borderRadius:'12px',objectFit:'contain'}}/>
          <button onClick={()=>setActivePhoto(null)} style={{position:'absolute',top:'20px',right:'20px',background:'rgba(255,255,255,0.15)',border:'none',borderRadius:'50%',width:'40px',height:'40px',color:'#fff',fontSize:'18px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}></button>
        </div>
      )}
    </div>
  )
}
