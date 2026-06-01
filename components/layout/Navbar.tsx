'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

function initials(n:string){return n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)}

export default function Navbar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [unreadNotifs, setUnreadNotifs] = useState(0)

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      setUser(user)
      if(user){
        sb.from('profiles').select('full_name,is_premium,avatar_url').eq('id',user.id).maybeSingle().then(({data})=>setProfile(data))
        // Load unread notifications count
        sb.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('read',false)
          .then(({count})=>setUnreadNotifs(count||0))
        // Realtime unread count
        const channel = sb.channel('notif-count')
          .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},()=>{
            setUnreadNotifs(u=>u+1)
          }).subscribe()
        return ()=>{ sb.removeChannel(channel) }
      }
    })
    const {data:{subscription}} = sb.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user||null)
      if(!session?.user) setProfile(null)
    })
    return ()=>subscription.unsubscribe()
  },[])

  async function logout(){
    await createClient().auth.signOut()
    setUser(null);setProfile(null);setDrop(false)
    router.push('/');router.refresh()
  }

  const links = [{href:'/discover',label:'People'},{href:'/pricing',label:'Pricing'},{href:'/admin/login',label:'Admin'}]

  return(
    <>
    <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(8px)',borderBottom:'1px solid #e2e8f0'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'60px'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'800',fontSize:'12px'}}>CL</div>
          <span style={{fontWeight:'700',fontSize:'16px',color:'#0f172a'}}>CampusLink <span style={{color:'#f97316'}}>KE</span></span>
        </Link>

        <div style={{display:'flex',alignItems:'center',gap:'4px'}} className="nav-links">
          {links.map(l=>(
            <Link key={l.href} href={l.href} style={{padding:'7px 14px',borderRadius:'8px',fontSize:'14px',color:'#64748b',fontWeight:'500',transition:'color 0.2s'}}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          {user && (
            <a href="/notifications" style={{position:'relative',display:'flex',alignItems:'center',textDecoration:'none'}} onClick={()=>setUnreadNotifs(0)}>
              <span style={{fontSize:'20px'}}>🔔</span>
              {unreadNotifs > 0 && (
                <span style={{position:'absolute',top:'-4px',right:'-4px',background:'#ef4444',color:'#fff',fontSize:'9px',fontWeight:'800',borderRadius:'50%',minWidth:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </a>
          )}

          {user ? (
            <div style={{position:'relative'}}>
              <button onClick={()=>setDrop(d=>!d)} style={{display:'flex',alignItems:'center',gap:'8px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'50px',padding:'5px 12px 5px 5px',cursor:'pointer',fontSize:'13px',fontWeight:'600',color:'#0f172a'}}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} style={{width:'28px',height:'28px',borderRadius:'50%',objectFit:'cover'}}/>
                  : <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'700'}}>{initials(profile?.full_name||user.email||'U')}</div>
                }
                <span className="nav-links">{profile?.full_name?.split(' ')[0]||'Account'}</span>
                {profile?.is_premium && <span style={{background:'#7c3aed',color:'#fff',fontSize:'10px',padding:'1px 6px',borderRadius:'50px',fontWeight:'700'}}>PRO</span>}
              </button>
              {drop && (
                <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',background:'#fff',borderRadius:'12px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'1px solid #e2e8f0',minWidth:'180px',zIndex:200}}>
                  {[{href:'/dashboard',label:'Dashboard'},{href:'/dashboard/profile',label:'Edit Profile'},{href:'/pricing',label:'Upgrade'}].map(item=>(
                    <Link key={item.href} href={item.href} onClick={()=>setDrop(false)} style={{display:'block',padding:'11px 16px',fontSize:'14px',color:'var(--text)',fontWeight:'500',borderBottom:'1px solid #e2e8f0'}}>{item.label}</Link>
                  ))}
                  <button onClick={logout} style={{width:'100%',textAlign:'left',padding:'11px 16px',fontSize:'14px',color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontWeight:'500'}}>Sign Out</button>
                </div>
              )}
            </div>
          ):(
            <>
              <Link href="/login" style={{padding:'8px 16px',fontSize:'14px',color:'#64748b',fontWeight:'500'}} className="nav-links">Sign In</Link>
              <Link href="/register" style={{padding:'9px 18px',fontSize:'14px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',borderRadius:'8px',fontWeight:'600',boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}}>Join Free</Link>
            </>
          )}
          <button onClick={()=>setOpen(o=>!o)} className="mob-btn" style={{background:'none',border:'none',padding:'6px',fontSize:'18px',cursor:'pointer',color:'#374151'}}></button>
        </div>
      </div>

      {open && (
        <div style={{background:'#fff',borderTop:'1px solid #e2e8f0',padding:'12px 20px'}}>
          {links.map(l=>(
            <Link key={l.href} href={l.href} onClick={()=>setOpen(false)} style={{display:'block',padding:'10px 0',fontSize:'15px',color:'var(--text)',fontWeight:'500',borderBottom:'1px solid #e2e8f0'}}>{l.label}</Link>
          ))}
          {user
            ? <button onClick={logout} style={{width:'100%',textAlign:'left',padding:'10px 0',fontSize:'15px',color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontWeight:'500',marginTop:'4px'}}>Sign Out</button>
            : <div style={{display:'flex',gap:'8px',marginTop:'10px'}}>
                <Link href="/login" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',border:'1px solid #e2e8f0',padding:'10px',borderRadius:'8px',fontSize:'14px',fontWeight:'600'}}>Sign In</Link>
                <Link href="/register" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'10px',borderRadius:'8px',fontSize:'14px',fontWeight:'600'}}>Join Free</Link>
              </div>
          }
        </div>
      )}
    </nav>
    <style>{`@media(min-width:768px){.mob-btn{display:none!important}}@media(max-width:767px){.nav-links{display:none!important}.mob-btn{display:none!important}.mob-auth{display:none!important}}`}</style>
    </>
  )
}
