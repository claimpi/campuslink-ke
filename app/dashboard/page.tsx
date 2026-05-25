import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function getInitials(name: string) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{welcome?: string}> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()

  const name = profile?.full_name || user.email?.split('@')[0] || 'Student'
  const isWelcome = params?.welcome === 'true'

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 16px'}}>

      {/* Welcome banner */}
      {isWelcome && (
        <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'20px',padding:'20px 24px',marginBottom:'24px',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <div style={{fontSize:'22px',fontWeight:'900',marginBottom:'4px'}}>🎉 Welcome to CampusLink KE, {name.split(' ')[0]}!</div>
            <div style={{fontSize:'14px',opacity:0.9}}>Your profile is live. Complete it to get discovered by other students.</div>
          </div>
          <Link href="/dashboard/profile" style={{background:'white',color:'#f97316',padding:'10px 20px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none'}}>Complete Profile →</Link>
        </div>
      )}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'linear-gradient(135deg,#fff7ed,#fed7aa)',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'900',fontSize:'20px',border:'2px solid #fed7aa'}}>
            {getInitials(name)}
          </div>
          <div>
            <h1 style={{fontSize:'22px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>Hi, {name.split(' ')[0]} 👋</h1>
            <p style={{color:'#9ca3af',fontSize:'14px'}}>{profile?.university || 'Update your profile'}</p>
          </div>
        </div>
        <Link href="/dashboard/profile" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'10px 20px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>
          Edit Profile
        </Link>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'16px',marginBottom:'28px'}}>
        {[
          {label:'Profile Views',value:profile?.profile_views||0,emoji:'👁️',bg:'#fff7ed',color:'#ea580c'},
          {label:'Status',value:profile?.is_premium?'Premium':'Free',emoji:'👑',bg:'#faf5ff',color:'#7c3aed'},
          {label:'Featured',value:profile?.is_featured?'Yes':'No',emoji:'⭐',bg:'#fefce8',color:'#ca8a04'},
          {label:'Top Student',value:profile?.is_top_student?'Yes':'No',emoji:'🏆',bg:'#f0fdf4',color:'#16a34a'},
        ].map(s=>(
          <div key={s.label} style={{background:'white',borderRadius:'16px',border:'1px solid #f3f4f6',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
            <div style={{width:'40px',height:'40px',background:s.bg,borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'12px'}}>{s.emoji}</div>
            <div style={{fontSize:'20px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>{s.value}</div>
            <div style={{fontSize:'12px',color:'#9ca3af'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
      {profile && (
        <div style={{background:'white',borderRadius:'20px',border:'1px solid #f3f4f6',padding:'24px',marginBottom:'24px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <h2 style={{fontWeight:'800',color:'#111827',fontSize:'16px'}}>Profile Completeness</h2>
            <span style={{fontSize:'13px',color:'#f97316',fontWeight:'700'}}>
              {[profile.bio,profile.whatsapp_number,profile.university,profile.course,(profile.interests||[]).length>0].filter(Boolean).length * 20}%
            </span>
          </div>
          <div style={{background:'#f3f4f6',borderRadius:'50px',height:'8px',overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'50px',width:`${[profile.bio,profile.whatsapp_number,profile.university,profile.course,(profile.interests||[]).length>0].filter(Boolean).length * 20}%`,transition:'width 0.5s'}} />
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'14px'}}>
            {[
              {label:'University',done:!!profile.university},
              {label:'Course',done:!!profile.course},
              {label:'WhatsApp',done:!!profile.whatsapp_number},
              {label:'Bio',done:!!profile.bio},
              {label:'Interests',done:(profile.interests||[]).length>0},
            ].map(item=>(
              <span key={item.label} style={{fontSize:'12px',padding:'4px 10px',borderRadius:'50px',background:item.done?'#f0fdf4':'#f9fafb',color:item.done?'#16a34a':'#9ca3af',border:`1px solid ${item.done?'#bbf7d0':'#e5e7eb'}`,fontWeight:'600'}}>
                {item.done?'✓':'○'} {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{fontWeight:'800',color:'#111827',fontSize:'18px',marginBottom:'16px'}}>Quick Actions</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
        {[
          {href:'/dashboard/profile',emoji:'✏️',title:'Edit Profile',desc:'Update your info & photo',bg:'#fff7ed',border:'#fed7aa'},
          {href:'/discover',emoji:'🔍',title:'Discover Students',desc:'Find and connect with others',bg:'#eff6ff',border:'#bfdbfe'},
          {href:'/groups',emoji:'💬',title:'WhatsApp Groups',desc:'Join university groups',bg:'#f0fdf4',border:'#bbf7d0'},
          {href:'/pricing',emoji:'👑',title:'Go Premium',desc:'Unlock all features',bg:'#faf5ff',border:'#c4b5fd'},
        ].map(action=>(
          <Link key={action.href} href={action.href} style={{background:'white',borderRadius:'16px',border:`1px solid ${action.border}`,padding:'20px',textDecoration:'none',display:'block',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',transition:'all 0.2s'}}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:'28px',marginBottom:'10px'}}>{action.emoji}</div>
            <div style={{fontWeight:'700',color:'#111827',fontSize:'14px',marginBottom:'4px'}}>{action.title}</div>
            <div style={{fontSize:'12px',color:'#9ca3af'}}>{action.desc}</div>
          </Link>
        ))}
      </div>

      {/* Upgrade CTA if not premium */}
      {!profile?.is_premium && (
        <div style={{marginTop:'24px',background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',borderRadius:'20px',padding:'24px',color:'white',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px'}}>
          <div>
            <div style={{fontWeight:'900',fontSize:'18px',marginBottom:'4px'}}>👑 Upgrade to Premium</div>
            <div style={{fontSize:'14px',opacity:0.85}}>Get unlimited unlocks, priority ranking & premium badge for KES 199/month</div>
          </div>
          <Link href="/pricing" style={{background:'white',color:'#7c3aed',padding:'11px 24px',borderRadius:'50px',fontWeight:'700',fontSize:'13px',textDecoration:'none',flexShrink:0}}>
            Upgrade Now
          </Link>
        </div>
      )}
    </div>
  )
}
