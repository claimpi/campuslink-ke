'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const plans = [
  {
    id: 'unlock',
    name: 'Unlock Number',
    price: 20,
    period: 'per unlock',
    color: '#f97316',
    popular: true,
    description: 'Get instant access to someone\'s WhatsApp number after connecting.',
    features: ['WhatsApp number revealed instantly','Direct connection on WhatsApp','One-time payment per contact','No subscription needed'],
  },
  {
    id: 'boost',
    name: 'Boost Profile',
    price: 50,
    period: '24 hours',
    color: '#0ea5e9',
    popular: false,
    description: 'Appear at the very top of People Nearby for 24 hours.',
    features: ['Top placement in People Nearby','3x more profile views','More connection requests','Instant activation'],
  },
  {
    id: 'verified',
    name: 'Verified Badge',
    price: 150,
    period: 'one-time',
    color: '#3b82f6',
    popular: false,
    description: 'Get a blue verified badge that builds trust on your profile.',
    features: ['Blue verified badge on profile','Higher trust from other users','Priority in search results','Badge never expires'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 299,
    period: 'per month',
    color: '#7c3aed',
    popular: false,
    best: true,
    description: 'Full access to all features. The complete experience.',
    features: ['See who viewed your profile','Unlimited contact unlocks','1 free boost per week','Verified badge included','Priority placement','No ads ever'],
  },
  {
    id: 'featured',
    name: 'Featured',
    price: 200,
    period: 'one-time',
    color: '#ea580c',
    popular: false,
    description: 'Get a Featured banner on your profile card permanently.',
    features: ['Featured banner on your card','Top of People Nearby list','Featured badge on profile','Highlighted card design'],
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: profile?.full_name || user.email,
          phone: profile?.whatsapp_number || '',
          paymentType: planId === 'unlock' ? 'unlock' : planId === 'premium' ? 'premium' : planId === 'featured' ? 'featured' : planId === 'verified' ? 'verified' : 'boost',
          amount: price,
        })
      })
      const data = await res.json()
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { alert(data.error || 'Payment failed'); setLoading(null) }
    } catch { alert('Something went wrong'); setLoading(null) }
  }

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'40px 20px'}}>
      {/* Header */}
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <h1 style={{fontSize:'36px',fontWeight:'900',color:'#0f172a',marginBottom:'12px'}}>Upgrade Your Experience</h1>
        <p style={{fontSize:'16px',color:'#64748b',maxWidth:'500px',margin:'0 auto'}}>Pay via M-Pesa. Your account upgrades instantly — no waiting, no manual approval.</p>
      </div>

      {/* Plans grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'20px',marginBottom:'48px'}}>
        {plans.map(plan=>(
          <div key={plan.id} style={{
            background:'#fff',
            borderRadius:'20px',
            border:`2px solid ${plan.best?plan.color:plan.popular?plan.color:'#e2e8f0'}`,
            padding:'28px 24px',
            position:'relative',
            boxShadow:plan.best?`0 8px 32px ${plan.color}25`:plan.popular?`0 4px 16px ${plan.color}20`:'0 2px 8px rgba(0,0,0,0.04)',
            transform:plan.best?'scale(1.03)':'none',
          }}>
            {/* Badge */}
            {plan.popular&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#fff',fontSize:'11px',fontWeight:'800',padding:'4px 14px',borderRadius:'50px',whiteSpace:'nowrap',letterSpacing:'0.5px'}}>MOST POPULAR</div>}
            {plan.best&&<div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:plan.color,color:'#fff',fontSize:'11px',fontWeight:'800',padding:'4px 14px',borderRadius:'50px',whiteSpace:'nowrap',letterSpacing:'0.5px'}}>BEST VALUE</div>}

            {/* Plan name */}
            <p style={{fontSize:'13px',fontWeight:'700',color:plan.color,marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px'}}>{plan.name}</p>

            {/* Price */}
            <div style={{marginBottom:'12px'}}>
              <span style={{fontSize:'36px',fontWeight:'900',color:'#0f172a'}}>KES {plan.price}</span>
              <span style={{fontSize:'13px',color:'#94a3b8',marginLeft:'6px'}}>{plan.period}</span>
            </div>

            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px',lineHeight:'1.5'}}>{plan.description}</p>

            {/* Features */}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'24px'}}>
              {plan.features.map(f=>(
                <div key={f} style={{display:'flex',gap:'8px',alignItems:'flex-start'}}>
                  <div style={{width:'16px',height:'16px',borderRadius:'50%',background:`${plan.color}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:'1px'}}>
                    <div style={{width:'6px',height:'6px',borderRadius:'50%',background:plan.color}}/>
                  </div>
                  <span style={{fontSize:'13px',color:'#374151'}}>{f}</span>
                </div>
              ))}
            </div>

            {/* Button */}
            <button onClick={()=>handlePay(plan.id,plan.price)} disabled={loading===plan.id}
              style={{width:'100%',padding:'13px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer',
                background:loading===plan.id?'#94a3b8':`linear-gradient(135deg,${plan.color},${plan.color}dd)`,
                color:'#fff',boxShadow:loading===plan.id?'none':`0 4px 12px ${plan.color}40`,
                transition:'all 0.2s'}}>
              {loading===plan.id?'Redirecting...`':`Pay KES ${plan.price}`}
            </button>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{background:'#fff',borderRadius:'20px',border:'1px solid #e2e8f0',padding:'36px',textAlign:'center'}}>
        <h2 style={{fontSize:'20px',fontWeight:'800',color:'#0f172a',marginBottom:'32px'}}>How it works</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'24px'}}>
          {[
            {n:'1',t:'Choose a plan',d:'Select the upgrade that suits you and click Pay'},
            {n:'2',t:'M-Pesa prompt',d:'You get an STK push. Enter your PIN to pay'},
            {n:'3',t:'Instant verification',d:'Pesapal confirms your payment automatically'},
            {n:'4',t:'Account updated',d:'Your account upgrades instantly, no waiting'},
          ].map(s=>(
            <div key={s.n}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'#fff7ed',border:'2px solid #fed7aa',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'16px',color:'#f97316',margin:'0 auto 12px'}}>{s.n}</div>
              <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'6px'}}>{s.t}</p>
              <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.5'}}>{s.d}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:'28px',background:'#f8fafc',borderRadius:'12px',padding:'14px',fontSize:'13px',color:'#64748b'}}>
          All payments via M-Pesa · Powered by Pesapal · Secure & instant
        </div>
      </div>
    </div>
  )
}
