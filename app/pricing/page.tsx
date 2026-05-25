import { MessageCircle } from 'lucide-react'

const PLANS = [
  { name:'Top Student', price:'KES 100', period:'One-Time', emoji:'⭐', border:'#fed7aa', highlight:'#fff7ed', features:['Top Student badge on your profile','Priority placement in listings','Amber highlighted card','Increased visibility in search'] },
  { name:'Premium', price:'KES 199', period:'Per Month', emoji:'👑', border:'#c4b5fd', highlight:'#faf5ff', featured:true, features:['Premium badge on your profile','Priority ranking in search','Purple highlighted card','Homepage featured placement','Profile view analytics'] },
  { name:'Featured', price:'KES 200', period:'One-Time', emoji:'✨', border:'#bfdbfe', highlight:'#eff6ff', features:['Homepage Featured section','Top of Discover results','Featured badge on profile','Highlighted card design'] },
]

export default function PricingPage() {
  return (
    <div style={{maxWidth:'1000px',margin:'0 auto',padding:'48px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#fff7ed',border:'1px solid #fed7aa',color:'#ea580c',padding:'6px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>💰 Simple Pricing</div>
        <h1 style={{fontSize:'clamp(28px,5vw,42px)',fontWeight:'900',color:'#111827',marginBottom:'8px'}}>Choose Your Plan</h1>
        <p style={{color:'#6b7280',fontSize:'16px'}}>All payments via M-Pesa to <strong style={{color:'#111827'}}>0790166252</strong></p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px',alignItems:'center'}}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{background:'white',borderRadius:'24px',border:`2px solid ${plan.border}`,overflow:'hidden',boxShadow:plan.featured?'0 20px 60px rgba(139,92,246,0.2)':'0 4px 20px rgba(0,0,0,0.06)',transform:plan.featured?'scale(1.04)':'scale(1)',position:'relative'}}>
            {plan.featured && <div style={{position:'absolute',top:0,left:0,right:0,background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'white',fontSize:'12px',fontWeight:'700',textAlign:'center',padding:'6px',letterSpacing:'0.5px'}}>MOST POPULAR</div>}
            <div style={{background:plan.highlight,padding:'28px 24px 20px',borderBottom:`1px solid ${plan.border}`,marginTop:plan.featured?'32px':0}}>
              <div style={{fontSize:'36px',marginBottom:'8px'}}>{plan.emoji}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:'800',fontSize:'18px',color:'#111827',marginBottom:'6px'}}>{plan.name}</div>
                  <div style={{fontSize:'38px',fontWeight:'900',color:'#111827',lineHeight:'1'}}>{plan.price}</div>
                  <div style={{fontSize:'13px',color:'#9ca3af',marginTop:'4px'}}>{plan.period}</div>
                </div>
              </div>
            </div>
            <div style={{padding:'24px'}}>
              <ul style={{listStyle:'none',padding:0,margin:'0 0 24px',display:'flex',flexDirection:'column',gap:'10px'}}>
                {plan.features.map(f=>(
                  <li key={f} style={{display:'flex',gap:'8px',alignItems:'flex-start',fontSize:'14px',color:'#374151'}}>
                    <span style={{color:'#22c55e',fontSize:'16px',flexShrink:0}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/254790166252?text=Hello%20CampusLink%20KE%2C%20I%20want%20to%20pay%20for%20${encodeURIComponent(plan.name)}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',textDecoration:'none',background:plan.featured?'linear-gradient(135deg,#f97316,#ea580c)':'white',color:plan.featured?'white':'#374151',border:plan.featured?'none':`2px solid ${plan.border}`,boxShadow:plan.featured?'0 8px 20px rgba(249,115,22,0.35)':'none'}}>
                <MessageCircle size={16}/> Pay KES &amp; Confirm
              </a>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:'48px',background:'linear-gradient(135deg,#fff7ed,#fef3c7)',border:'1px solid #fed7aa',borderRadius:'20px',padding:'28px',textAlign:'center'}}>
        <div style={{fontSize:'28px',marginBottom:'10px'}}>📱</div>
        <h3 style={{fontWeight:'800',color:'#111827',marginBottom:'12px',fontSize:'18px'}}>How Payment Works</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'12px',maxWidth:'700px',margin:'0 auto'}}>
          {[['1️⃣','Send M-Pesa','to 0790166252'],['2️⃣','Click Confirm','WhatsApp button'],['3️⃣','Send Mpesa','confirmation msg'],['4️⃣','Admin approves','within few hours']].map(([n,t,d])=>(
            <div key={t} style={{background:'white',borderRadius:'12px',padding:'14px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:'22px',marginBottom:'4px'}}>{n}</div>
              <div style={{fontWeight:'700',fontSize:'13px',color:'#111827'}}>{t}</div>
              <div style={{fontSize:'12px',color:'#9ca3af'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
