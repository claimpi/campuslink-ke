import Link from 'next/link'

export default function Home() {
  const stats = [['500+','Students'],['40+','Universities'],['200+','Groups'],['1,000+','Connections']]
  const features = [
    {title:'Student Profiles',desc:'Create your profile with photo, bio, university and interests. Get discovered by peers across Kenya.'},
    {title:'WhatsApp Groups',desc:'Browse and join verified WhatsApp groups for your university, course or interest area.'},
    {title:'Connect Directly',desc:'Unlock a student\'s WhatsApp number for just KES 20 and connect directly on WhatsApp.'},
    {title:'Get Featured',desc:'Stand out with Top Student badge, Premium membership, or Homepage featured placement.'},
  ]
  return (
    <div>
      {/* Hero */}
      <section style={{background:'linear-gradient(160deg,#fff7ed 0%,#fff 60%,#f5f3ff 100%)',padding:'80px 20px 90px'}}>
        <div style={{maxWidth:'760px',margin:'0 auto',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'#fff7ed',border:'1px solid #fed7aa',color:'#ea580c',padding:'5px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600',marginBottom:'24px'}}>Kenya's Student Network</div>
          <h1 style={{fontSize:'clamp(32px,6vw,58px)',fontWeight:'900',color:'#0f172a',lineHeight:'1.1',marginBottom:'20px',letterSpacing:'-0.5px'}}>
            Connect with Students<br/><span style={{color:'#f97316'}}>Across Kenya</span>
          </h1>
          <p style={{fontSize:'18px',color:'#64748b',marginBottom:'36px',maxWidth:'520px',margin:'0 auto 36px'}}>
            Find study partners, join WhatsApp groups, unlock contacts and build your university network.
          </p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/register" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'14px 32px',borderRadius:'10px',fontWeight:'700',fontSize:'16px',boxShadow:'0 6px 20px rgba(249,115,22,0.35)'}}>Get Started Free</Link>
            <Link href="/discover" style={{background:'#fff',color:'#0f172a',padding:'14px 32px',borderRadius:'10px',fontWeight:'600',fontSize:'16px',border:'1.5px solid #e2e8f0'}}>Browse Students</Link>
          </div>
          <div style={{display:'flex',justifyContent:'center',gap:'40px',flexWrap:'wrap',marginTop:'56px'}}>
            {stats.map(([n,l])=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{fontSize:'26px',fontWeight:'900',color:'#f97316'}}>{n}</div>
                <div style={{fontSize:'13px',color:'#94a3b8',marginTop:'2px'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{maxWidth:'1100px',margin:'0 auto',padding:'80px 20px'}}>
        <h2 style={{fontSize:'30px',fontWeight:'800',color:'#0f172a',textAlign:'center',marginBottom:'48px'}}>Everything you need to connect</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'20px'}}>
          {features.map(f=>(
            <div key={f.title} style={{background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0',padding:'28px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <h3 style={{fontWeight:'700',color:'#0f172a',fontSize:'16px',marginBottom:'10px'}}>{f.title}</h3>
              <p style={{fontSize:'14px',color:'#64748b',lineHeight:'1.7'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section style={{background:'#0f172a',padding:'80px 20px'}}>
        <div style={{maxWidth:'900px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'30px',fontWeight:'800',color:'#fff',marginBottom:'12px'}}>Simple pricing</h2>
          <p style={{color:'#94a3b8',marginBottom:'48px',fontSize:'15px'}}>All payments via M-Pesa. Upgrades applied automatically.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px'}}>
            {[
              {name:'Unlock Contact',price:'KES 20',desc:'View a student\'s WhatsApp number'},
              {name:'Add Group',price:'KES 100',desc:'List your WhatsApp group'},
              {name:'Top Student',price:'KES 100',desc:'Badge + priority listing'},
              {name:'Premium',price:'KES 199/mo',desc:'All features unlocked',highlight:true},
              {name:'Featured',price:'KES 200',desc:'Homepage placement'},
            ].map(p=>(
              <div key={p.name} style={{background:p.highlight?'linear-gradient(135deg,#f97316,#ea580c)':'rgba(255,255,255,0.05)',border:p.highlight?'none':'1px solid rgba(255,255,255,0.1)',borderRadius:'14px',padding:'24px 20px',textAlign:'left'}}>
                <div style={{fontSize:'15px',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>{p.name}</div>
                <div style={{fontSize:'22px',fontWeight:'900',color:'#fff',marginBottom:'6px'}}>{p.price}</div>
                <div style={{fontSize:'13px',color:p.highlight?'rgba(255,255,255,0.85)':'#94a3b8'}}>{p.desc}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'32px'}}>
            <Link href="/pricing" style={{background:'#fff',color:'#0f172a',padding:'13px 32px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',display:'inline-block'}}>View Pricing</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:'80px 20px',textAlign:'center',background:'#fff'}}>
        <h2 style={{fontSize:'32px',fontWeight:'900',color:'#0f172a',marginBottom:'12px'}}>Ready to join?</h2>
        <p style={{color:'#64748b',marginBottom:'28px',fontSize:'16px'}}>Join hundreds of Kenyan students already on CampusLink KE.</p>
        <Link href="/register" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'14px 36px',borderRadius:'10px',fontWeight:'700',fontSize:'16px',boxShadow:'0 6px 20px rgba(249,115,22,0.35)',display:'inline-block'}}>Create Free Account</Link>
      </section>
    </div>
  )
}
