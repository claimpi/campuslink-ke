import Link from 'next/link'

const s = {
  hero: {background:'linear-gradient(135deg,#fff7ed 0%,#ffffff 50%,#faf5ff 100%)',padding:'72px 16px 80px',textAlign:'center' as const},
  badge: {display:'inline-flex',alignItems:'center',gap:'6px',background:'#fff7ed',border:'1px solid #fed7aa',color:'#ea580c',padding:'6px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600',marginBottom:'24px'},
  h1: {fontSize:'clamp(32px,6vw,60px)',fontWeight:'900',color:'#111827',lineHeight:'1.1',marginBottom:'20px'},
  orange: {color:'#f97316'},
  sub: {fontSize:'18px',color:'#6b7280',maxWidth:'580px',margin:'0 auto 36px',lineHeight:'1.6'},
  btnPrimary: {display:'inline-flex',alignItems:'center',gap:'8px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'14px 32px',borderRadius:'50px',fontWeight:'700',fontSize:'16px',textDecoration:'none',boxShadow:'0 8px 24px rgba(249,115,22,0.4)',transition:'transform 0.2s'},
  btnOutline: {display:'inline-flex',alignItems:'center',gap:'8px',border:'2px solid #f97316',color:'#f97316',padding:'14px 32px',borderRadius:'50px',fontWeight:'700',fontSize:'16px',textDecoration:'none',transition:'all 0.2s'},
  statNum: {fontSize:'28px',fontWeight:'900',color:'#f97316'},
  statLabel: {fontSize:'13px',color:'#9ca3af',marginTop:'2px'},
  sectionTitle: {fontSize:'clamp(22px,4vw,30px)',fontWeight:'800',color:'#111827',marginBottom:'8px'},
  card: {background:'white',borderRadius:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',border:'1px solid #f3f4f6',overflow:'hidden',transition:'all 0.3s'},
}

const STUDENTS = [
  {id:'1',name:'Amina Wanjiku',uni:'University of Nairobi',course:'Computer Science',year:2,badge:'FEATURED',badgeColor:'#8b5cf6',initials:'AW',avatarBg:'#ede9fe',textColor:'#7c3aed'},
  {id:'2',name:'Brian Ochieng',uni:'Kenyatta University',course:'Business Admin',year:3,badge:'TOP STUDENT',badgeColor:'#f97316',initials:'BO',avatarBg:'#fff7ed',textColor:'#ea580c'},
  {id:'3',name:'Catherine Muthoni',uni:'Strathmore University',course:'Law',year:1,initials:'CM',avatarBg:'#f0fdf4',textColor:'#16a34a'},
  {id:'4',name:'Dennis Kipchoge',uni:'JKUAT',course:'Mech. Engineering',year:4,initials:'DK',avatarBg:'#eff6ff',textColor:'#2563eb',isPremium:true},
]

const FEATURES = [
  {emoji:'👥',title:'Student Profiles',desc:'Build your campus identity with photos, bio, course, and interests.',bg:'#fff7ed'},
  {emoji:'💬',title:'WhatsApp Groups',desc:'Discover and join verified groups for your university and course.',bg:'#f0fdf4'},
  {emoji:'⭐',title:'Get Featured',desc:'Appear on the homepage and top search results for just KES 200.',bg:'#fefce8'},
  {emoji:'👑',title:'Premium',desc:'Unlimited unlocks, analytics, and premium badge — KES 199/month.',bg:'#faf5ff'},
  {emoji:'🔓',title:'Unlock Contacts',desc:'Access WhatsApp numbers of students you want to connect with.',bg:'#eff6ff'},
  {emoji:'✅',title:'Verified Groups',desc:'Every group is reviewed and verified by our admin team.',bg:'#f0fdfa'},
]

export default function HomePage() {
  return (
    <div style={{minHeight:'100vh'}}>
      {/* HERO */}
      <section style={s.hero}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <div style={s.badge}>⚡ Kenya's #1 Student Network</div>
          <h1 style={s.h1}>
            Connect with Students<br/>
            <span style={s.orange}>Across Kenya</span>
          </h1>
          <p style={s.sub}>Find study partners, join WhatsApp groups, unlock contacts, and build your campus network — all in one place.</p>
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap',marginBottom:'56px'}}>
            <Link href="/register" style={s.btnPrimary}>Join Free →</Link>
            <Link href="/discover" style={s.btnOutline}>Browse Students</Link>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'48px',flexWrap:'wrap'}}>
            {[['500+','Students'],['50+','Universities'],['200+','WA Groups'],['1K+','Connections']].map(([n,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={s.statNum}>{n}</div>
                <div style={s.statLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED STUDENTS */}
      <section style={{maxWidth:'1200px',margin:'0 auto',padding:'64px 16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'28px'}}>
          <div>
            <h2 style={s.sectionTitle}>⭐ Featured Students</h2>
            <p style={{color:'#9ca3af',fontSize:'14px'}}>Top students on CampusLink KE</p>
          </div>
          <Link href="/discover" style={{color:'#f97316',fontSize:'14px',fontWeight:'600',textDecoration:'none'}}>View all →</Link>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'20px'}}>
          {STUDENTS.map(st=>(
            <div key={st.id} style={{...s.card}}>
              {st.badge && (
                <div style={{background:st.badgeColor,color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'7px',letterSpacing:'0.5px'}}>
                  {st.badge === 'FEATURED' ? '✨' : '⭐'} {st.badge}
                </div>
              )}
              <div style={{padding:'20px'}}>
                <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'14px'}}>
                  <div style={{width:'52px',height:'52px',borderRadius:'50%',background:st.avatarBg,color:st.textColor,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'16px',flexShrink:0,border:`2px solid ${st.avatarBg}`}}>
                    {st.initials}
                  </div>
                  <div>
                    <div style={{fontWeight:'700',color:'#111827',fontSize:'15px',lineHeight:'1.3'}}>{st.name}</div>
                    <div style={{display:'flex',gap:'6px',marginTop:'6px',flexWrap:'wrap'}}>
                      <span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 8px',borderRadius:'50px',fontWeight:'600'}}>Y{st.year}</span>
                      {st.isPremium && <span style={{background:'#faf5ff',color:'#7c3aed',fontSize:'11px',padding:'2px 8px',borderRadius:'50px',fontWeight:'600'}}>👑 Premium</span>}
                    </div>
                  </div>
                </div>
                <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'4px'}}>📚 {st.course}</div>
                <div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'16px'}}>📍 {st.uni}</div>
                <Link href={`/profile/${st.id}`} style={{display:'block',textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'9px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',textDecoration:'none'}}>
                  View Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{background:'#f9fafb',padding:'64px 16px'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{...s.sectionTitle,marginBottom:'4px'}}>Everything You Need to Connect</h2>
          <p style={{color:'#9ca3af',fontSize:'15px',marginBottom:'40px'}}>Built specifically for Kenyan university students</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
            {FEATURES.map(f=>(
              <div key={f.title} style={{background:'white',borderRadius:'16px',padding:'24px',border:'1px solid #f3f4f6',textAlign:'left',boxShadow:'0 2px 8px rgba(0,0,0,0.04)'}}>
                <div style={{width:'44px',height:'44px',borderRadius:'12px',background:f.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',marginBottom:'14px'}}>{f.emoji}</div>
                <div style={{fontWeight:'700',color:'#111827',marginBottom:'6px',fontSize:'15px'}}>{f.title}</div>
                <div style={{fontSize:'13px',color:'#6b7280',lineHeight:'1.6'}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING PREVIEW */}
      <section style={{padding:'64px 16px',background:'linear-gradient(135deg,#fff7ed,#faf5ff)'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{...s.sectionTitle,marginBottom:'4px'}}>Simple, Transparent Pricing</h2>
          <p style={{color:'#9ca3af',fontSize:'14px',marginBottom:'40px'}}>All payments via M-Pesa to <strong style={{color:'#111827'}}>0790166252</strong></p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'20px'}}>
            {[
              {name:'Top Student',price:'KES 100',period:'One-Time',emoji:'⭐',border:'#fed7aa',bg:'#fff7ed'},
              {name:'Premium',price:'KES 199',period:'Per Month',emoji:'👑',border:'#c4b5fd',bg:'#faf5ff',featured:true},
              {name:'Featured',price:'KES 200',period:'One-Time',emoji:'✨',border:'#bfdbfe',bg:'#eff6ff'},
            ].map(p=>(
              <div key={p.name} style={{background:'white',borderRadius:'20px',border:`2px solid ${p.border}`,padding:'28px 20px',boxShadow:p.featured?'0 12px 40px rgba(139,92,246,0.2)':'0 4px 16px rgba(0,0,0,0.06)',transform:p.featured?'scale(1.03)':'scale(1)'}}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>{p.emoji}</div>
                <div style={{fontWeight:'800',fontSize:'16px',color:'#111827',marginBottom:'8px'}}>{p.name}</div>
                <div style={{fontSize:'32px',fontWeight:'900',color:'#111827',marginBottom:'2px'}}>{p.price}</div>
                <div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'20px'}}>{p.period}</div>
                <Link href="/pricing" style={{display:'block',textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'10px',borderRadius:'12px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'72px 16px',textAlign:'center',background:'white'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <div style={{fontSize:'48px',marginBottom:'16px'}}>🎓</div>
          <h2 style={{fontSize:'clamp(24px,4vw,36px)',fontWeight:'900',color:'#111827',marginBottom:'12px'}}>Ready to Join the Network?</h2>
          <p style={{color:'#6b7280',fontSize:'16px',marginBottom:'32px'}}>Join hundreds of Kenyan students already connecting on CampusLink KE.</p>
          <Link href="/register" style={s.btnPrimary}>Create Free Account →</Link>
        </div>
      </section>
    </div>
  )
}
