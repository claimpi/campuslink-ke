'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const COIN_PACKAGES = [
  { id:'coins_50',  coins:50,   price:50,  label:'Starter',  color:'#94a3b8', popular:false, perCoin:1.0 },
  { id:'coins_100', coins:100,  price:99,  label:'Basic',    color:'#3b82f6', popular:false, perCoin:0.99 },
  { id:'coins_200', coins:200,  price:179, label:'Popular',  color:'#f97316', popular:true,  perCoin:0.90 },
  { id:'coins_500', coins:500,  price:399, label:'Value',    color:'#8b5cf6', popular:false, perCoin:0.80 },
  { id:'coins_1000',coins:1000, price:699, label:'Best Deal',color:'#f59e0b', popular:false, perCoin:0.70 },
]

const VIP_PLANS = [
  { id:'boost',      name:'Boost 24h',     price:50,  icon:'🚀', desc:'Top of discover for 24hrs' },
  { id:'top_student',name:'Verified Badge',price:150, icon:'✓',  desc:'Blue verified badge forever' },
  { id:'featured',   name:'Featured',      price:200, icon:'⭐', desc:'Featured banner on your card' },
  { id:'premium',    name:'Premium',       price:299, icon:'👑', desc:'All features, unlimited messages' },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string|null>(null)
  const [coins, setCoins] = useState(0)
  const [freeLeft, setFreeLeft] = useState(10)
  const [tab, setTab] = useState<'coins'|'vip'>('coins')

  useEffect(()=>{
    const sb = createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      if(!user) return
      sb.from('profiles').select('coins,free_messages_used').eq('id',user.id).maybeSingle()
        .then(({data})=>{
          if(data){ setCoins(data.coins||0); setFreeLeft(Math.max(0,10-(data.free_messages_used||0))) }
        })
    })
  },[])

  async function pay(planId: string, price: number) {
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }
    setLoading(planId)
    try {
      const { data: profile } = await sb.from('profiles').select('full_name,whatsapp_number').eq('id', user.id).maybeSingle()
      const res = await fetch('/api/pesapal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, userName: profile?.full_name || user.email, phone: profile?.whatsapp_number || '', paymentType: planId, amount: price })
      })
      const data = await res.json()
      if (data.redirectUrl) window.location.href = data.redirectUrl
      else { alert(data.error || 'Payment failed'); setLoading(null) }
    } catch { alert('Something went wrong'); setLoading(null) }
  }

  return (
    <div style={{maxWidth:480,margin:'0 auto',background:'#f5f6fa',minHeight:'100vh',paddingBottom:90}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',padding:'24px 16px 20px',color:'#fff'}}>
        <h1 style={{fontSize:22,fontWeight:900,margin:'0 0 4px'}}>Shop</h1>
        <p style={{fontSize:13,opacity:0.9,margin:0}}>Coins · VIP · Gifts</p>
        {/* Coin balance */}
        <div style={{marginTop:14,background:'rgba(255,255,255,0.2)',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:28}}>🪙</span>
            <div>
              <p style={{margin:0,fontWeight:900,fontSize:22}}>{coins}</p>
              <p style={{margin:0,fontSize:11,opacity:0.85}}>Your coin balance</p>
            </div>
          </div>
          <div style={{textAlign:'right',fontSize:12,opacity:0.85}}>
            <p style={{margin:0}}>{freeLeft} free msg{freeLeft!==1?'s':''} left</p>
            <p style={{margin:'2px 0 0'}}>5 coins per message</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',background:'#fff',borderBottom:'1px solid #e8ecf0'}}>
        {(['coins','vip'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'13px',border:'none',background:'none',cursor:'pointer',
            fontSize:14,fontWeight:tab===t?800:500,
            color:tab===t?'#f97316':'#94a3b8',
            borderBottom:tab===t?'2.5px solid #f97316':'2.5px solid transparent'}}>
            {t==='coins'?'🪙 Buy Coins':'👑 VIP Plans'}
          </button>
        ))}
      </div>

      {tab==='coins'&&(
        <div style={{padding:'16px 12px'}}>
          <p style={{fontSize:13,color:'#64748b',marginBottom:16,textAlign:'center'}}>
            Use coins to chat · Send gifts · Unlock features
          </p>

          {/* How coins work */}
          <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:14,padding:'12px 16px',marginBottom:16,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,textAlign:'center'}}>
            {[['💬','5 coins','per message'],['❤️','10 coins','per gift'],['🚀','Earn coins','by referral']].map(([icon,val,desc])=>(
              <div key={val}>
                <div style={{fontSize:20,marginBottom:3}}>{icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:'#f97316'}}>{val}</div>
                <div style={{fontSize:10,color:'#94a3b8'}}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Coin packages */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {COIN_PACKAGES.map(pkg=>(
              <div key={pkg.id} onClick={()=>pay(pkg.id,pkg.price)}
                style={{background:'#fff',borderRadius:14,padding:'16px 12px',textAlign:'center',cursor:'pointer',
                  border:pkg.popular?`2px solid ${pkg.color}`:'1px solid #e8ecf0',
                  boxShadow:pkg.popular?`0 4px 16px ${pkg.color}30`:'0 2px 8px rgba(0,0,0,0.06)',
                  position:'relative',transition:'transform 0.15s'}}
                onMouseDown={e=>(e.currentTarget.style.transform='scale(0.97)')}
                onMouseUp={e=>(e.currentTarget.style.transform='scale(1)')}>
                {pkg.popular&&<div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',
                  background:pkg.color,color:'#fff',fontSize:9,fontWeight:800,padding:'2px 10px',borderRadius:20,whiteSpace:'nowrap'}}>
                  MOST POPULAR
                </div>}
                <div style={{fontSize:28,marginBottom:4}}>🪙</div>
                <div style={{fontSize:22,fontWeight:900,color:pkg.color}}>{pkg.coins}</div>
                <div style={{fontSize:11,color:'#94a3b8',marginBottom:10}}>coins</div>
                <div style={{background:pkg.popular?pkg.color:'#f1f5f9',color:pkg.popular?'#fff':pkg.color,
                  borderRadius:20,padding:'8px 0',fontWeight:800,fontSize:14}}>
                  {loading===pkg.id?'Loading...':'KES '+pkg.price}
                </div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:5}}>≈ KES {pkg.perCoin.toFixed(2)}/coin</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='vip'&&(
        <div style={{padding:'16px 12px',display:'flex',flexDirection:'column',gap:10}}>
          {VIP_PLANS.map(plan=>(
            <div key={plan.id} style={{background:'#fff',borderRadius:14,padding:'16px',display:'flex',alignItems:'center',gap:14,
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',border:'1px solid #e8ecf0',cursor:'pointer'}}
              onClick={()=>pay(plan.id,plan.price)}>
              <div style={{width:48,height:48,borderRadius:12,background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                {plan.icon}
              </div>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:15,color:'#0f172a',margin:'0 0 3px'}}>{plan.name}</p>
                <p style={{fontSize:12,color:'#94a3b8',margin:0}}>{plan.desc}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p style={{fontWeight:900,fontSize:16,color:'#f97316',margin:'0 0 6px'}}>KES {plan.price}</p>
                <div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',borderRadius:20,padding:'5px 14px',fontSize:12,fontWeight:700}}>
                  {loading===plan.id?'...':'Pay'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* M-Pesa note */}
      <div style={{margin:'8px 12px',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:12,padding:'12px 16px',display:'flex',gap:10,alignItems:'center'}}>
        <span style={{fontSize:20}}>📱</span>
        <p style={{fontSize:12,color:'#166534',margin:0,lineHeight:1.5}}>Pay via <strong>M-Pesa</strong> or card. Your account updates instantly after payment.</p>
      </div>
    </div>
  )
}
