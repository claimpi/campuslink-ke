'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function BottomNav() {
  const path = usePathname()
  const [user, setUser] = useState<any>(null)
  const [avatar, setAvatar] = useState<string|null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) sb.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
        .then(({ data }) => setAvatar(data?.avatar_url || null))
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null)
      if (!session?.user) setAvatar(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const isActive = (href: string) => path === href || path.startsWith(href + '/')

  const navItems = [
    { href: '/discover', label: 'Home', icon: HomeIcon },
    { href: '/chat', label: 'Chat', icon: ChatIcon },
    { href: '/pricing', label: 'Coins', icon: CoinIcon },
    { href: user ? '/dashboard' : '/login', label: user ? 'Me' : 'Login', icon: null, isProfile: true },
  ]

  return (
    <>
      <div style={{height:64}} className="bnav-spacer"/>
      <nav className="bnav" style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:200,
        background:'rgba(255,255,255,0.98)',backdropFilter:'blur(16px)',
        borderTop:'1px solid #e8ecf0',
        display:'flex',alignItems:'center',height:64,
        boxShadow:'0 -2px 20px rgba(0,0,0,0.08)'
      }}>
        {navItems.map(({ href, icon: Icon, label, isProfile }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} style={{
              flex:1,display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:3,padding:'6px 4px',
              textDecoration:'none',position:'relative'
            }}>
              {/* Active indicator dot */}
              {active && <div style={{position:'absolute',top:4,width:4,height:4,borderRadius:'50%',background:'#f97316'}}/>}

              {isProfile && user ? (
                avatar
                  ? <img src={avatar} style={{width:26,height:26,borderRadius:'50%',objectFit:'cover',border:active?'2px solid #f97316':'2px solid #e2e8f0'}} alt=""/>
                  : <div style={{width:26,height:26,borderRadius:'50%',background:active?'linear-gradient(135deg,#f97316,#ea580c)':'#f1f5f9',color:active?'#fff':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>
                      {user.email?.[0]?.toUpperCase()||'U'}
                    </div>
              ) : Icon ? (
                <Icon active={active}/>
              ) : null}
              <span style={{fontSize:10,fontWeight:active?700:500,color:active?'#f97316':'#94a3b8',lineHeight:1}}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
      <style>{`
        @media(min-width:768px){.bnav{display:none!important}.bnav-spacer{display:none!important}}
      `}</style>
    </>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#f97316' : '#94a3b8'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill={active?'#f97316':'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function ChatIcon({ active }: { active: boolean }) {
  const c = active ? '#f97316' : '#94a3b8'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill={active?'#f97316':'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}
function CoinIcon({ active }: { active: boolean }) {
  const c = active ? '#f97316' : '#94a3b8'
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v2m0 8v2M9 9h4.5a1.5 1.5 0 010 3H10a1.5 1.5 0 000 3H15"/>
    </svg>
  )
}
