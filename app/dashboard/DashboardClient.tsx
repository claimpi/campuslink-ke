'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

function getInitials(name: string) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }

export default function DashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh',flexDirection:'column',gap:'12px'}}>
      <div style={{width:'40px',height:'40px',border:'3px solid #fed7aa',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'#9ca3af',fontSize:'14px'}}>Loading dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name = profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const completeness = [profile?.bio, profile?.whatsapp_number, profile?.university, profile?.course, (profile?.interests||[]).length > 0].filter(Boolean).length * 20

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 16px'}}>
      {isWelcome && (
        <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'20px',padding:'20px 24px',marginBottom:'24px',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',boxShadow:'0 8px 24px rgba(249,115,22,0.35)'}}>
          <div>
            <div style={{fontSize:'20px',fontWeight:'900',marginBottom:'4px'}}>🎉 Welcome, {name.split(' ')[0]}!</div>
            <div style={{fontSize:'14px',opacity:0.9}}>Complete your profile to get discovered by other students.</div>
          </div>
          <Link href="/dashboard/profile" style={{background:'white',color:'#f97316',padding:'10px 20px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none'}}>Complete Profile →</Link>
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'linear-gradient(135deg,#fff7ed,#fed7aa)',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'900',fontSize:'20px',border:'2px solid #fed7aa'}}>
            {getInitials(name)}
          </div>
          <div>
            <h1 style={{fontSize:'22px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>Hi, {name.split(' ')[0]} 👋</h1>
            <p style={{color:'#9ca3af',fontSize:'14px'}}>{profile?.university || 'Add your university'}</p>
          </div>
        </div>
        <Link href="/dashboard/profile" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'10px 20px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>✏️ Edit Profile</Link>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'14px',marginBottom:'24px'}}>
        {[
          {label:'Profile Views',value:profile?.profile_views||0,emoji:'👁️',bg:'#fff7ed'},
          {label:'Status',value:profile?.is_premium?'Premium':'Free',emoji:'👑',bg:'#faf5ff'},
          {label:'Featured',value:profile?.is_featured?'Yes ⭐':'No',emoji:'✨',bg:'#fefce8'},
          {label:'Top Student',value:profile?.is_top_student?'Yes':'No',emoji:'🏆',bg:'#f0fdf4'},
        ].map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'16px',border:'1px solid #f3f4f6',padding:'18px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{width:'38px',height:'38px',background:s.bg,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{s.emoji}</div>
            <div style={{fontSize:'18px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>{s.value}</div>
            <div style={{fontSize:'12px',color:'#9ca3af'}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white',borderRadius:'20px',border:'1px solid #f3f4f6',padding:'22px',marginBottom:'22px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'10px'}}>
          <h2 style={{fontWeight:'800',color:'#111827',fontSize:'15px'}}>Profile Completeness</h2>
          <span style={{fontSize:'14px',color:'#f97316',fontWeight:'800'}}>{completeness}%</span>
        </div>
        <div style={{background:'#f3f4f6',borderRadius:'50px',height:'8px',overflow:'hidden',marginBottom:'14px'}}>
          <div style={{height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'50px',width:`${completeness}%`,transition:'width 0.6s'}}/>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:'7px'}}>
          {[{label:'University',done:!!profile?.university},{label:'Course',done:!!profile?.course},{label:'WhatsApp',done:!!profile?.whatsapp_number},{label:'Bio',done:!!profile?.bio},{label:'Interests',done:(profile?.interests||[]).length>0}].map(item=>(
            <span key={item.label} style={{fontSize:'12px',padding:'4px 10px',borderRadius:'50px',background:item.done?'#f0fdf4':'#f9fafb',color:item.done?'#16a34a':'#9ca3af',border:`1px solid ${item.done?'#bbf7d0':'#e5e7eb'}`,fontWeight:'600'}}>
              {item.done?'✓':'○'} {item.label}
            </span>
          ))}
        </div>
      </div>

      <h2 style={{fontWeight:'800',color:'#111827',fontSize:'17px',marginBottom:'14px'}}>Quick Actions</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))',gap:'12px',marginBottom:'24px'}}>
        {[
          {href:'/dashboard/profile',emoji:'✏️',title:'Edit Profile',desc:'Update your info',border:'#fed7aa'},
          {href:'/discover',emoji:'🔍',title:'Browse Students',desc:'Find and connect',border:'#bfdbfe'},
          {href:'/groups',emoji:'💬',title:'WhatsApp Groups',desc:'Join university groups',border:'#bbf7d0'},
          {href:'/pricing',emoji:'👑',title:'Go Premium',desc:'Unlock all features',border:'#c4b5fd'},
        ].map(a=>(
          <Link key={a.href} href={a.href} style={{background:'white',borderRadius:'16px',border:`1.5px solid ${a.border}`,padding:'18px',textDecoration:'none',display:'block',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:'26px',marginBottom:'8px'}}>{a.emoji}</div>
            <div style={{fontWeight:'700',color:'#111827',fontSize:'14px',marginBottom:'3px'}}>{a.title}</div>
            <div style={{fontSize:'12px',color:'#9ca3af'}}>{a.desc}</div>
          </Link>
        ))}
      </div>

      {!profile?.is_premium && (
        <div style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',borderRadius:'20px',padding:'22px 24px',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px',boxShadow:'0 8px 24px rgba(139,92,246,0.3)'}}>
          <div>
            <div style={{fontWeight:'900',fontSize:'17px',marginBottom:'4px'}}>👑 Upgrade to Premium — KES 199/month</div>
            <div style={{fontSize:'13px',opacity:0.85}}>Unlimited unlocks, priority ranking, premium badge & analytics</div>
          </div>
          <Link href="/pricing" style={{background:'white',color:'#7c3aed',padding:'10px 22px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none',flexShrink:0}}>Upgrade Now</Link>
        </div>
      )}
    </div>
  )
}
