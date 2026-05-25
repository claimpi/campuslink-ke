'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const PLANS = [
  { type:'top_student', name:'Top Student', price:100, period:'One-Time', emoji:'⭐', border:'#fed7aa', highlight:'#fff7ed',
    features:['Top Student badge on your profile','Priority placement in listings','Amber highlighted card','Increased visibility in search'] },
  { type:'premium', name:'Premium', price:199, period:'Per Month', emoji:'👑', border:'#c4b5fd', highlight:'#faf5ff', featured:true,
    features:['Premium badge on your profile','Priority ranking in search','Purple highlighted card','Homepage featured placement','Profile view analytics'] },
  { type:'featured', name:'Featured', price:200, period:'One-Time', emoji:'✨', border:'#bfdbfe', highlight:'#eff6ff',
    features:['Homepage Featured section','Top of Discover results','Featured badge on profile','Highlighted card design'] },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handlePay(planType: string) {
    setLoading(planType)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('full_name,whatsapp_number').eq('user_id', user.id).single()

      const res = await fetch('/api/pesapal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: profile?.full_name || user.email,
          phone: profile?.whatsapp_number || '',
          paymentType: planType,
        }),
      })

      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(null); return }
      // Redirect to Pesapal payment page
      window.location.href = data.redirectUrl
    } catch (err: any) {
      setError('Payment failed. Please try again.')
      setLoading(null)
    }
  }

  return (
    <div style={{maxWidth:'1000px',margin:'0 auto',padding:'48px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#fff7ed',border:'1px solid #fed7aa',color:'#ea580c',padding:'6px 16px',borderRadius:'50px',fontSize:'13px',fontWeight:'600',marginBottom:'16px'}}>💳 Automatic M-Pesa Payments</div>
        <h1 style={{fontSize:'clamp(28px,5vw,42px)',fontWeight:'900',color:'#111827',marginBottom:'8px'}}>Choose Your Plan</h1>
        <p style={{color:'#6b7280',fontSize:'16px'}}>Pay instantly via M-Pesa, card, or bank. Upgrade applied automatically.</p>
      </div>

      {error && (
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'14px',padding:'14px 18px',marginBottom:'24px',color:'#dc2626',fontSize:'14px',textAlign:'center'}}>
          ⚠️ {error} — Make sure you're <a href="/login" style={{color:'#dc2626',fontWeight:'700'}}>logged in</a> first.
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'24px',alignItems:'center'}}>
        {PLANS.map(plan => (
          <div key={plan.type} style={{background:'white',borderRadius:'24px',border:`2px solid ${plan.border}`,overflow:'hidden',boxShadow:plan.featured?'0 20px 60px rgba(139,92,246,0.2)':'0 4px 20px rgba(0,0,0,0.06)',transform:plan.featured?'scale(1.04)':'scale(1)',position:'relative'}}>
            {plan.featured && <div style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'white',fontSize:'12px',fontWeight:'700',textAlign:'center',padding:'7px',letterSpacing:'0.5px'}}>⭐ MOST POPULAR</div>}
            <div style={{background:plan.highlight,padding:'28px 24px 20px',borderBottom:`1px solid ${plan.border}`}}>
              <div style={{fontSize:'36px',marginBottom:'10px'}}>{plan.emoji}</div>
              <div style={{fontWeight:'800',fontSize:'18px',color:'#111827',marginBottom:'6px'}}>{plan.name}</div>
              <div style={{fontSize:'38px',fontWeight:'900',color:'#111827',lineHeight:'1'}}>KES {plan.price}</div>
              <div style={{fontSize:'13px',color:'#9ca3af',marginTop:'4px'}}>{plan.period}</div>
            </div>
            <div style={{padding:'24px'}}>
              <ul style={{listStyle:'none',padding:0,margin:'0 0 24px',display:'flex',flexDirection:'column',gap:'10px'}}>
                {plan.features.map(f=>(
                  <li key={f} style={{display:'flex',gap:'8px',alignItems:'flex-start',fontSize:'14px',color:'#374151'}}>
                    <span style={{color:'#22c55e',fontSize:'16px',flexShrink:0,lineHeight:'1.4'}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePay(plan.type)}
                disabled={!!loading}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'14px',borderRadius:'12px',fontWeight:'700',fontSize:'15px',border:'none',cursor:loading?'not-allowed':'pointer',background:loading===plan.type?'#9ca3af':plan.featured?'linear-gradient(135deg,#f97316,#ea580c)':'white',color:plan.featured||loading===plan.type?'white':'#374151',outline:plan.featured?'none':`2px solid ${plan.border}`,boxShadow:plan.featured&&!loading?'0 8px 20px rgba(249,115,22,0.35)':'none',transition:'all 0.2s'}}>
                {loading === plan.type ? (
                  <><div style={{width:'16px',height:'16px',border:'2px solid rgba(255,255,255,0.4)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/> Redirecting...</>
                ) : (
                  <> 📱 Pay KES {plan.price}</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{marginTop:'48px',background:'linear-gradient(135deg,#fff7ed,#fef3c7)',border:'1px solid #fed7aa',borderRadius:'20px',padding:'28px',textAlign:'center'}}>
        <div style={{fontSize:'28px',marginBottom:'10px'}}>⚡</div>
        <h3 style={{fontWeight:'800',color:'#111827',marginBottom:'14px',fontSize:'18px'}}>How Automatic Payment Works</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px',maxWidth:'700px',margin:'0 auto'}}>
          {[
            ['1️⃣','Click Pay','Choose your plan'],
            ['2️⃣','M-Pesa STK Push','Enter PIN on phone'],
            ['3️⃣','Auto-verified','Pesapal confirms'],
            ['4️⃣','Instant upgrade','Profile updated now'],
          ].map(([n,t,d])=>(
            <div key={t} style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:'24px',marginBottom:'6px'}}>{n}</div>
              <div style={{fontWeight:'700',fontSize:'13px',color:'#111827'}}>{t}</div>
              <div style={{fontSize:'12px',color:'#9ca3af',marginTop:'2px'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
