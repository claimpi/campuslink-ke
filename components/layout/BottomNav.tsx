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
      if (user) sb.from('profiles').select('avatar_url,full_name').eq('id', user.id).maybeSingle()
        .then(({ data }) => setAvatar(data?.avatar_url || null))
    })
  }, [])

  function initials(email: string) { return email?.[0]?.toUpperCase() || 'U' }

  const active = (href: string) => path === href || path.startsWith(href + '/')

  const navItems = [
    { href: '/', icon: HomeIcon, label: 'Home' },
    { href: '/groups', icon: GroupIcon, label: 'Groups' },
    { href: '/pricing', icon: PriceIcon, label: 'Pricing' },
    { href: user ? '/dashboard' : '/login', icon: user ? ProfileIcon : LoginIcon, label: user ? 'Profile' : 'Login', isProfile: true },
  ]

  return (
    <>
      {/* Spacer so content isn't hidden behind bottom nav */}
      <div style={{height:'68px'}} className="bottom-nav-spacer"/>
      <nav style={{position:'fixed',bottom:0,left:0,right:0,zIndex:100,background:'rgba(255,255,255,0.97)',backdropFilter:'blur(12px)',borderTop:'1px solid #e2e8f0',display:'flex',alignItems:'center',height:'64px',padding:'0 8px',boxShadow:'0 -4px 20px rgba(0,0,0,0.06)'}} className="bottom-nav">
        {navItems.map(({ href, icon: Icon, label, isProfile }) => {
          const isActive = active(href)
          return (
            <Link key={href} href={href} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'3px',padding:'8px 4px',borderRadius:'12px',textDecoration:'none',transition:'all 0.15s',background:isActive?'#fff7ed':'transparent'}}>
              {isProfile && user ? (
                avatar
                  ? <img src={avatar} style={{width:'26px',height:'26px',borderRadius:'50%',objectFit:'cover',border:isActive?'2px solid #f97316':'2px solid #e2e8f0'}}/>
                  : <div style={{width:'26px',height:'26px',borderRadius:'50%',background:isActive?'linear-gradient(135deg,#f97316,#ea580c)':'#f1f5f9',color:isActive?'#fff':'#94a3b8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700'}}>{initials(user.email)}</div>
              ) : (
                <Icon color={isActive ? '#f97316' : '#94a3b8'} size={22}/>
              )}
              <span style={{fontSize:'10px',fontWeight:isActive?'700':'500',color:isActive?'#f97316':'#94a3b8',lineHeight:'1'}}>{label}</span>
            </Link>
          )
        })}
      </nav>
      <style>{`
        @media(min-width:768px){ .bottom-nav{ display:none!important } .bottom-nav-spacer{ display:none!important } }
      `}</style>
    </>
  )
}

function HomeIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function GroupIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}
function PriceIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  )
}
function ProfileIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function LoginIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  )
}
