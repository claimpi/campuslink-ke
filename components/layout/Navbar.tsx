'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

function getInitials(name: string) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }

export default function Navbar() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase.from('profiles').select('full_name,is_premium,is_top_student').eq('user_id', user.id).single()
          .then(({ data }) => setProfile(data))
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (!session?.user) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setDropdownOpen(false)
    router.push('/'); router.refresh()
  }

  const navLinks = [
    {href:'/discover',label:'Discover'},
    {href:'/groups',label:'Groups'},
    {href:'/discover?top=true',label:'Top Students'},
    {href:'/pricing',label:'Pricing'},
    {href:'/admin',label:'Admin'},
  ]

  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(12px)',borderBottom:'1px solid #fed7aa',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
        <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px'}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
            <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'linear-gradient(135deg,#f97316,#ea580c)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'13px',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>CL</div>
            <span style={{fontWeight:'800',fontSize:'18px',color:'#111827'}}>CampusLink <span style={{color:'#f97316'}}>KE</span></span>
          </Link>

          {/* Desktop links */}
          <div style={{display:'flex',alignItems:'center',gap:'2px'}} className="desk-nav">
            {navLinks.map(({href,label})=>(
              <Link key={label} href={href} style={{padding:'8px 12px',borderRadius:'8px',fontSize:'14px',color:'#4b5563',textDecoration:'none',fontWeight:'500'}}>
                {label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            {user ? (
              <div style={{position:'relative'}}>
                <button onClick={()=>setDropdownOpen(d=>!d)} style={{display:'flex',alignItems:'center',gap:'8px',background:'#f9fafb',border:'1.5px solid #e5e7eb',borderRadius:'50px',padding:'5px 14px 5px 5px',cursor:'pointer',fontSize:'13px',fontWeight:'600',color:'#374151'}}>
                  <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'linear-gradient(135deg,#fff7ed,#fed7aa)',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'12px'}}>
                    {getInitials(profile?.full_name || user.email || 'U')}
                  </div>
                  {profile?.full_name?.split(' ')[0] || 'Me'}
                  {profile?.is_premium && <span style={{background:'#faf5ff',color:'#7c3aed',fontSize:'10px',padding:'1px 6px',borderRadius:'50px',fontWeight:'700'}}>PRO</span>}
                </button>
                {dropdownOpen && (
                  <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:'white',borderRadius:'14px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'1px solid #f3f4f6',minWidth:'180px',zIndex:100,overflow:'hidden'}}>
                    <Link href="/dashboard" onClick={()=>setDropdownOpen(false)} style={{display:'block',padding:'12px 16px',fontSize:'14px',color:'#374151',textDecoration:'none',fontWeight:'600',borderBottom:'1px solid #f9fafb'}}>
                      📊 Dashboard
                    </Link>
                    <Link href="/dashboard/profile" onClick={()=>setDropdownOpen(false)} style={{display:'block',padding:'12px 16px',fontSize:'14px',color:'#374151',textDecoration:'none',fontWeight:'600',borderBottom:'1px solid #f9fafb'}}>
                      ✏️ Edit Profile
                    </Link>
                    <Link href="/pricing" onClick={()=>setDropdownOpen(false)} style={{display:'block',padding:'12px 16px',fontSize:'14px',color:'#7c3aed',textDecoration:'none',fontWeight:'600',borderBottom:'1px solid #f9fafb'}}>
                      👑 Go Premium
                    </Link>
                    <button onClick={handleLogout} style={{width:'100%',textAlign:'left',padding:'12px 16px',fontSize:'14px',color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontWeight:'600'}}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" style={{fontSize:'14px',color:'#6b7280',padding:'8px 14px',borderRadius:'8px',textDecoration:'none',fontWeight:'500'}} className="desk-nav">Login</Link>
                <Link href="/register" style={{fontSize:'14px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'9px 20px',borderRadius:'50px',fontWeight:'700',textDecoration:'none',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>Join Free</Link>
              </>
            )}
            {/* Mobile hamburger */}
            <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',padding:'6px',fontSize:'20px'}} className="mob-menu">☰</button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div style={{background:'white',borderTop:'1px solid #fed7aa',padding:'12px 16px'}}>
            {navLinks.map(({href,label})=>(
              <Link key={label} href={href} onClick={()=>setOpen(false)} style={{display:'block',padding:'11px 12px',borderRadius:'10px',fontSize:'14px',color:'#374151',textDecoration:'none',fontWeight:'500',marginBottom:'2px'}}>
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={()=>setOpen(false)} style={{display:'block',padding:'11px 12px',borderRadius:'10px',fontSize:'14px',color:'#374151',textDecoration:'none',fontWeight:'600',marginBottom:'2px'}}>📊 Dashboard</Link>
                <button onClick={handleLogout} style={{width:'100%',textAlign:'left',padding:'11px 12px',borderRadius:'10px',fontSize:'14px',color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontWeight:'600'}}>🚪 Sign Out</button>
              </>
            ) : (
              <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
                <Link href="/login" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',border:'1.5px solid #e5e7eb',color:'#374151',padding:'10px',borderRadius:'10px',fontSize:'14px',fontWeight:'600',textDecoration:'none'}}>Login</Link>
                <Link href="/register" onClick={()=>setOpen(false)} style={{flex:1,textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'10px',borderRadius:'10px',fontSize:'14px',fontWeight:'700',textDecoration:'none'}}>Join Free</Link>
              </div>
            )}
          </div>
        )}
      </nav>
      <style>{`
        @media(min-width:768px){.mob-menu{display:none!important}}
        @media(max-width:767px){.desk-nav{display:none!important}}
      `}</style>
    </>
  )
}
