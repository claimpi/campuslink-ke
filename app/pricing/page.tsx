'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const PLANS = [
  {type:'unlock',name:'Unlock Contact',price:20,period:'per unlock',tag:'Most Popular',tagColor:'#f97316',
    desc:'Get instant access to a student\'s WhatsApp number.',
    features:['Instant WhatsApp number revealed','Direct connection on WhatsApp','One-time payment per contact'],
    btnStyle:{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff'}},
  {type:'add_group',name:'List a Group',price:100,period:'one-time',
    desc:'Add your WhatsApp group to the public directory.',
    features:['Listed in the groups directory','Verified badge on your group','Auto-published after payment'],
    btnStyle:{background:'#0f172a',color:'#fff'}},
  {type:'top_student',name:'Top Student',price:100,period:'one-time',
    desc:'Stand out with a Top Student badge and priority listing.',
    features:['Top Student badge on profile','Priority in search results','Highlighted profile card'],
    btnStyle:{background:'#0f172a',color:'#fff'}},
  {type:'premium',name:'Premium',price:199,period:'per month',featured:true,tag:'Best Value',tagColor:'#7c3aed',
    desc:'Full access with unlimited unlocks and premium tools.',
    features:['Unlimited contact unlocks','Premium badge on profile','Priority ranking in search','Profile view analytics','Homepage placement'],
    btnStyle:{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff'}},
  {type:'featured',name:'Featured',price:200,period:'one-time',
    desc:'Get homepage placement and top search visibility.',
    features:['Featured on homepage','Top of Discover results','Featured badge on profile','Highlighted card design'],
    btnStyle:{background:'#0f172a',color:'#fff'}},
]

export default function PricingPage(){
  const router=useRouter()
  const [loading,setLoading]=useState<string|null>(null)
  const [error,setError]=useState('')

  async function pay(type:string){
    setLoading(type);setError('')
    const sb=createClient()
    const {data:{user}}=await sb.auth.getUser()
    if(!user){router.push('/login');return}
    const {data:profile}=await sb.from('profiles').select('full_name,whatsapp_number').eq('id',user.id).maybeSingle()
    const res=await fetch('/api/pesapal',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:user.id,userEmail:user.email,userName:profile?.full_name||user.email,phone:profile?.whatsapp_number||'',paymentType:type})})
    const data=await res.json()
    if(data.redirectUrl) window.location.href=data.redirectUrl
    else{setError(data.error||'Payment failed. Please sign in first.');setLoading(null)}
  }

  return(
    <div style={{background:'#f8fafc',minHeight:'100vh',padding:'48px 20px 80px'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'56px'}}>
          <h1 style={{fontSize:'clamp(28px,4vw,40px)',fontWeight:'900',color:'#0f172a',marginBottom:'12px',letterSpacing:'-0.5px'}}>Simple, transparent pricing</h1>
          <p style={{color:'#64748b',fontSize:'16px',maxWidth:'480px',margin:'0 auto'}}>Pay via M-Pesa and your account upgrades automatically — no manual approval needed.</p>
        </div>

        {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'12px',padding:'13px 18px',marginBottom:'28px',color:'#dc2626',fontSize:'14px',textAlign:'center',maxWidth:'600px',margin:'0 auto 28px'}}>
          {error} — <a href="/login" style={{color:'#dc2626',fontWeight:'700',textDecoration:'underline'}}>Sign in first</a>
        </div>}

        {/* Plans grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'16px',alignItems:'start'}}>
          {PLANS.map(p=>(
            <div key={p.type} style={{background:'#fff',borderRadius:'20px',border:p.featured?'2px solid #7c3aed':'1px solid #e2e8f0',padding:'28px 22px',boxShadow:p.featured?'0 8px 40px rgba(124,58,237,0.15)':'0 1px 4px rgba(0,0,0,0.04)',position:'relative',transition:'box-shadow 0.2s'}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow=p.featured?'0 12px 50px rgba(124,58,237,0.2)':'0 6px 24px rgba(0,0,0,0.08)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow=p.featured?'0 8px 40px rgba(124,58,237,0.15)':'0 1px 4px rgba(0,0,0,0.04)'}>
              {p.tag&&<div style={{position:'absolute',top:'-11px',left:'50%',transform:'translateX(-50%)',background:p.tagColor,color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 12px',borderRadius:'50px',whiteSpace:'nowrap',letterSpacing:'0.3px'}}>{p.tag}</div>}

              <h3 style={{fontWeight:'800',fontSize:'16px',color:'#0f172a',marginBottom:'4px',marginTop:p.tag?'6px':0}}>{p.name}</h3>
              <div style={{display:'flex',alignItems:'baseline',gap:'4px',marginBottom:'4px'}}>
                <span style={{fontSize:'32px',fontWeight:'900',color:'#0f172a',lineHeight:'1'}}>KES {p.price}</span>
              </div>
              <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.3px',fontWeight:'600'}}>{p.period}</p>
              <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.6',marginBottom:'20px',minHeight:'40px'}}>{p.desc}</p>

              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'9px',marginBottom:'24px'}}>
                {p.features.map(f=>(
                  <li key={f} style={{display:'flex',gap:'8px',alignItems:'flex-start',fontSize:'13px',color:'#374151'}}>
                    <span style={{color:'#16a34a',fontWeight:'700',flexShrink:0,marginTop:'1px'}}>✓</span>{f}
                  </li>
                ))}
              </ul>

              <button onClick={()=>pay(p.type)} disabled={!!loading}
                style={{...p.btnStyle as React.CSSProperties,width:'100%',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer',opacity:loading&&loading!==p.type?0.5:1,transition:'opacity 0.2s'}}>
                {loading===p.type?'Redirecting...':`Pay KES ${p.price}`}
              </button>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{marginTop:'64px',background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',padding:'36px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
          <h2 style={{fontSize:'20px',fontWeight:'800',color:'#0f172a',marginBottom:'28px',textAlign:'center'}}>How it works</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'24px'}}>
            {[
              {step:'1',title:'Choose a plan',desc:'Select the upgrade that suits you and click Pay.'},
              {step:'2',title:'M-Pesa prompt',desc:'You\'ll receive an STK push. Enter your PIN to pay.'},
              {step:'3',title:'Instant verification',desc:'Pesapal confirms your payment automatically.'},
              {step:'4',title:'Profile updated',desc:'Your account upgrades instantly — no waiting.'},
            ].map(s=>(
              <div key={s.step} style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#fff7ed',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'14px',flexShrink:0,border:'1px solid #fed7aa'}}>{s.step}</div>
                <div>
                  <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'4px'}}>{s.title}</p>
                  <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.5'}}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'28px',padding:'16px',background:'#f8fafc',borderRadius:'12px',textAlign:'center',border:'1px solid #e2e8f0'}}>
            <p style={{fontSize:'13px',color:'#64748b'}}>All payments via M-Pesa · Powered by Pesapal · Need help? WhatsApp <strong style={{color:'#0f172a'}}>0790166252</strong></p>
          </div>
        </div>
      </div>
    </div>
  )
}
