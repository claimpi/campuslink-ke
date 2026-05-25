'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const PLANS = [
  {type:'unlock',name:'Unlock Contact',price:20,period:'Per unlock',desc:'View a student\'s WhatsApp number and connect directly.',features:['Instant WhatsApp access','Direct connection','One-time payment']},
  {type:'add_group',name:'List a Group',price:100,period:'One-time',desc:'Add your WhatsApp group to the directory.',features:['Listed in directory','Auto-published after payment','Visible to all students']},
  {type:'top_student',name:'Top Student',price:100,period:'One-time',desc:'Get the Top Student badge and priority listing.',features:['Top Student badge','Priority in search','Highlighted profile card']},
  {type:'premium',name:'Premium',price:199,period:'Per month',desc:'Full access — unlimited unlocks, analytics, and more.',features:['Unlimited contact unlocks','Premium badge','Priority ranking','Profile analytics','Homepage placement'],featured:true},
  {type:'featured',name:'Featured',price:200,period:'One-time',desc:'Appear on the homepage and top of search results.',features:['Homepage featured section','Top of discover results','Featured badge on profile']},
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
    else{setError(data.error||'Payment failed. Make sure you are logged in.');setLoading(null)}
  }

  return(
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'48px 20px'}}>
      <div style={{textAlign:'center',marginBottom:'48px'}}>
        <h1 style={{fontSize:'32px',fontWeight:'900',color:'#0f172a',marginBottom:'8px'}}>Pricing</h1>
        <p style={{color:'#64748b',fontSize:'16px'}}>Pay via M-Pesa · Upgrades applied automatically</p>
      </div>

      {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'12px',padding:'13px 16px',marginBottom:'24px',color:'#dc2626',fontSize:'14px',textAlign:'center'}}>
        {error} — <a href="/login" style={{color:'#dc2626',fontWeight:'700'}}>Sign in first</a>
      </div>}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'20px',alignItems:'start'}}>
        {PLANS.map(p=>(
          <div key={p.type} style={{background:'#fff',borderRadius:'18px',border:p.featured?'2px solid #f97316':'1px solid #e2e8f0',overflow:'hidden',boxShadow:p.featured?'0 8px 32px rgba(249,115,22,0.15)':'0 1px 4px rgba(0,0,0,0.05)'}}>
            {p.featured&&<div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:'12px',fontWeight:'700',textAlign:'center',padding:'7px',letterSpacing:'0.5px'}}>MOST POPULAR</div>}
            <div style={{padding:'24px'}}>
              <h3 style={{fontWeight:'800',fontSize:'16px',color:'#0f172a',marginBottom:'4px'}}>{p.name}</h3>
              <div style={{fontSize:'32px',fontWeight:'900',color:'#0f172a',marginBottom:'2px'}}>KES {p.price}</div>
              <div style={{fontSize:'13px',color:'#94a3b8',marginBottom:'14px'}}>{p.period}</div>
              <p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.6',marginBottom:'16px'}}>{p.desc}</p>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'8px',marginBottom:'20px'}}>
                {p.features.map(f=>(
                  <li key={f} style={{display:'flex',gap:'8px',fontSize:'13px',color:'#374151'}}>
                    <span style={{color:'#16a34a',fontWeight:'700',flexShrink:0}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button onClick={()=>pay(p.type)} disabled={!!loading} style={{width:'100%',background:loading===p.type?'#94a3b8':p.featured?'linear-gradient(135deg,#f97316,#ea580c)':'#0f172a',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer',boxShadow:p.featured&&!loading?'0 4px 14px rgba(249,115,22,0.3)':'none',transition:'opacity 0.2s'}}>
                {loading===p.type?'Redirecting...':`Pay KES ${p.price}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:'48px',background:'#f8fafc',borderRadius:'16px',border:'1px solid #e2e8f0',padding:'28px',textAlign:'center'}}>
        <h3 style={{fontWeight:'700',color:'#0f172a',marginBottom:'12px',fontSize:'16px'}}>How it works</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'12px',maxWidth:'640px',margin:'0 auto'}}>
          {[['Click Pay','Choose your plan and click Pay'],['M-Pesa STK','Enter your PIN on your phone'],['Auto-verified','Pesapal confirms instantly'],['Upgrade applied','Your profile updates live']].map(([t,d])=>(
            <div key={t} style={{background:'#fff',borderRadius:'12px',padding:'16px',border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:'700',fontSize:'13px',color:'#0f172a',marginBottom:'4px'}}>{t}</div>
              <div style={{fontSize:'12px',color:'#94a3b8'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
