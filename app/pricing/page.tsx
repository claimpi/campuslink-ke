'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const plans = [
  {
    id: 'unlock', name: 'Unlock Number', price: 20, period: 'per unlock',
    color: '#f97316', bg: '#fff7ed', border: '#fed7aa', popular: true,
    description: 'Get instant access to someone\'s WhatsApp number.',
    features: ['WhatsApp number revealed instantly','Direct connection on WhatsApp','One-time per contact','No subscription needed'],
  },
  {
    id: 'boost', name: 'Boost Profile', price: 50, period: '24 hours',
    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd', popular: false,
    description: 'Appear at the very top of People Nearby for 24 hours.',
    features: ['Top placement in People Nearby','3x more profile views','More connection requests','Instant activation'],
  },
  {
    id: 'verified', name: 'Verified Badge', price: 150, period: 'one-time',
    color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', popular: false,
    description: 'Get a blue verified badge that builds trust.',
    features: ['Blue verified badge on profile','Higher trust from others','Priority in search results','Badge never expires'],
  },
  {
    id: 'premium', name: 'Premium', price: 299, period: 'per month',
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', best: true,
    description: 'Full access to all features.',
    features: ['See who viewed your profile','Unlimited contact unlocks','1 free boost per week','Verified badge included','Priority placement','No ads ever'],
  },
  {
    id: 'featured', name: 'Featured', price: 200, period: 'one-time',
    color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', popular: false,
    description: 'Get a Featured banner on your profile card.',
    features: ['Featured banner on your card','Top of People Nearby','Featured badge on profile','Highlighted card design'],
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string|null>(null)

  async function handlePay(planId: string, price: number) {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    setLoading(planId)
    try {
      const { data: profile } = await sb.from('profiles').select('full_name,whatsapp_number').eq('id', user.id).maybeSingle()
      const res = await fetch('/api/pesapal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, userName: profile?.full_name || user.email,
          phone: profile?.whatsapp_number || '', paymentType: planId === 'verified' ? 'top_student' : planId, amount: price })
      })
      const data = await res.json()
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { alert(data.error || 'Payment failed'); setLoading(null) }
    } catch { alert('Something went wrong'); setLoading(null) }
  }

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'48px 20px'}}>

      {/* Header */}
      <div style={{textAlign:'center',marginBottom:'52px'}}>
        <h1 style={{fontSize:'38px',fontWeight:'900',color:'#0f172a',marginBottom:'14px',lineHeight:'1.2'}}>Simple, transparent pricing</h1>
        <p style={{fontSize:'16px',color:'#64748b',maxWidth:'480px',margin:'0 auto',lineHeight:'1.6'}}>Pay via M-Pesa and your account upgrades instantly — no manual approval needed.</p>
      </div>

      {/* All plans - equal 5 columns */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'20px',marginBottom:'52px'}}>
        {plans.map(plan=>(
          <PlanCard key={plan.id} plan={plan} loading={loading} onPay={handlePay}/>
        ))}
      </div>

      {/* How it works */}
      <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',padding:'32px 24px',textAlign:'center'}}>
        <h2 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'8px'}}>How it works</h2>
        <p style={{fontSize:'14px',color:'#94a3b8',marginBottom:'28px'}}>Pay via M-Pesa in 4 simple steps</p>

        {/* Progress bar */}
        <div style={{background:'#f1f5f9',borderRadius:'50px',height:'4px',marginBottom:'28px',overflow:'hidden'}}>
          <div style={{background:'linear-gradient(90deg,#f97316,#ea580c)',height:'100%',width:'100%',borderRadius:'50px'}}/>
        </div>

        {/* 2x2 grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'16px',marginBottom:'28px'}}>
          {[
            {n:'1',t:'Choose a plan',d:'Select the upgrade that suits you and click Pay'},
            {n:'2',t:'M-Pesa Prompt',d:'You receive an STK push on your phone. Enter your PIN'},
            {n:'3',t:'Verification',d:'Pesapal confirms your payment automatically'},
            {n:'4',t:'Account Updated',d:'Your account upgrades instantly — no waiting'},
          ].map((s,i)=>(
            <div key={s.n} style={{background:'#f8fafc',borderRadius:'14px',padding:'20px 16px',textAlign:'center',border:'1px solid #e2e8f0',position:'relative'}}>
              {i < 3 && (
                <div style={{position:'absolute',top:'50%',right:'-9px',transform:'translateY(-50%)',
                  display:i===1?'none':'flex',
                  width:'16px',height:'16px',alignItems:'center',justifyContent:'center',
                  background:'#fff7ed',borderRadius:'50%',border:'1px solid #fed7aa',
                  fontSize:'10px',color:'#f97316',zIndex:1,fontWeight:'700'}}>
                </div>
              )}
              <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#f97316,#ea580c)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'13px',color:'#fff',margin:'0 auto 10px'}}>
                {s.n}
              </div>
              <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'6px'}}>{s.t}</p>
              <p style={{fontSize:'12px',color:'#64748b',lineHeight:'1.5'}}>{s.d}</p>
            </div>
          ))}
        </div>

        {/* Payment trust logos */}
        <div style={{background:'#f8fafc',borderRadius:'12px',padding:'16px 20px',display:'flex',alignItems:'center',justifyContent:'center',gap:'20px',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'36px',height:'36px',background:'#00a651',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'11px'}}>M</div>
            <div>
              <p style={{fontSize:'12px',fontWeight:'700',color:'#0f172a'}}>M-Pesa</p>
              <p style={{fontSize:'10px',color:'#94a3b8'}}>Safaricom</p>
            </div>
          </div>
          <div style={{width:'1px',height:'32px',background:'#e2e8f0'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <div style={{width:'36px',height:'36px',background:'#1a56db',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'11px'}}>PP</div>
            <div>
              <p style={{fontSize:'12px',fontWeight:'700',color:'#0f172a'}}>Pesapal</p>
              <p style={{fontSize:'10px',color:'#94a3b8'}}>Secure payments</p>
            </div>
          </div>
          <div style={{width:'1px',height:'32px',background:'#e2e8f0'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div style={{width:'20px',height:'20px',background:'#16a34a',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700'}}>s</div>
            <p style={{fontSize:'12px',color:'#64748b',fontWeight:'600'}}>SSL Secured</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({plan,loading,onPay}:{plan:any,loading:string|null,onPay:(id:string,price:number)=>void}){
  return(
    <div style={{background:'#fff',borderRadius:'20px',border:`2px solid ${plan.best||plan.popular?plan.color:'#e2e8f0'}`,padding:'28px',position:'relative',
      boxShadow:plan.best?`0 8px 32px ${plan.color}20`:plan.popular?`0 4px 16px ${plan.color}15`:'0 2px 8px rgba(0,0,0,0.04)',
      transition:'transform 0.2s,box-shadow 0.2s'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-3px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 36px ${plan.color}25`}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow=plan.best?`0 8px 32px ${plan.color}20`:plan.popular?`0 4px 16px ${plan.color}15`:'0 2px 8px rgba(0,0,0,0.04)'}}>

      {plan.popular&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#fff',fontSize:'11px',fontWeight:'800',padding:'4px 16px',borderRadius:'50px',whiteSpace:'nowrap',letterSpacing:'0.5px'}}>MOST POPULAR</div>}
      {plan.best&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#fff',fontSize:'11px',fontWeight:'800',padding:'4px 16px',borderRadius:'50px',whiteSpace:'nowrap',letterSpacing:'0.5px'}}>BEST VALUE</div>}

      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
        <div style={{width:'40px',height:'40px',borderRadius:'10px',background:plan.bg,border:`1px solid ${plan.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <div style={{width:'16px',height:'16px',borderRadius:'50%',background:plan.color}}/>
        </div>
        <div>
          <p style={{fontSize:'12px',fontWeight:'700',color:plan.color,textTransform:'uppercase',letterSpacing:'0.5px'}}>{plan.name}</p>
          <p style={{fontSize:'11px',color:'#94a3b8'}}>{plan.period}</p>
        </div>
      </div>

      <div style={{marginBottom:'14px'}}>
        <span style={{fontSize:'40px',fontWeight:'900',color:'#0f172a',lineHeight:'1'}}>KES {plan.price}</span>
      </div>

      <p style={{fontSize:'13px',color:'#64748b',marginBottom:'18px',lineHeight:'1.5',minHeight:'36px'}}>{plan.description}</p>

      <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
        {plan.features.map((f:string)=>(
          <div key={f} style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
            <div style={{width:'18px',height:'18px',borderRadius:'50%',background:plan.bg,border:`1.5px solid ${plan.color}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px'}}>
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{fontSize:'13px',color:'#374151',lineHeight:'1.4'}}>{f}</span>
          </div>
        ))}
      </div>

      <button onClick={()=>onPay(plan.id,plan.price)} disabled={loading===plan.id}
        style={{width:'100%',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading===plan.id?'not-allowed':'pointer',
          background:loading===plan.id?'#94a3b8':`linear-gradient(135deg,${plan.color}ee,${plan.color})`,
          color:'#fff',boxShadow:loading===plan.id?'none':`0 4px 14px ${plan.color}40`,transition:'all 0.2s'}}>
        {loading===plan.id?'Redirecting...`':`Pay KES ${plan.price}`}
      </button>
    </div>
  )
}
