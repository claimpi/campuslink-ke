'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const UNIS=['All Universities','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Technical University of Kenya','Maseno University']
const CATS=['All Categories','Technology','Business','Law','Engineering','Medicine','Education','Arts','Agriculture','Sciences']

export default function GroupsPage(){
  const router=useRouter()
  const [groups,setGroups]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [uni,setUni]=useState('All Universities')
  const [cat,setCat]=useState('All Categories')
  const [showAdd,setShowAdd]=useState(false)
  const [paying,setPaying]=useState(false)
  const [form,setForm]=useState({name:'',whatsapp_link:'',description:'',university:'',category:'Technology',member_count:'0'})
  const set=(k:string)=>(e:any)=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    createClient().from('whatsapp_groups').select('*').eq('payment_status','approved').order('is_featured',{ascending:false})
      .then(({data,error})=>{ setGroups(!error&&data&&data.length>0?data:[]); setLoading(false) })
  },[])

  async function handleAdd(e:React.FormEvent){
    e.preventDefault()
    const sb=createClient()
    const {data:{user}}=await sb.auth.getUser()
    if(!user){router.push('/login');return}
    if(!form.name||!form.whatsapp_link||!form.university){alert('Fill all required fields');return}
    setPaying(true)
    try{
      // First save group as pending
      const {data:group,error}=await sb.from('whatsapp_groups').insert([{
        name:form.name, whatsapp_link:form.whatsapp_link, description:form.description,
        university:form.university, category:form.category, member_count:parseInt(form.member_count)||0,
        added_by:user.id, payment_status:'pending', is_verified:false, is_featured:false
      }]).select().single()
      if(error){alert('Error: '+error.message);setPaying(false);return}

      // Then initiate payment
      const {data:curr}=await sb.from('profiles').select('full_name,whatsapp_number').eq('id',user.id).maybeSingle()
      const res=await fetch('/api/pesapal',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:user.id,userEmail:user.email,userName:curr?.full_name||user.email,phone:curr?.whatsapp_number||'',paymentType:'add_group',groupId:group.id})})
      const data=await res.json()
      if(data.redirectUrl) window.location.href=data.redirectUrl
      else{alert('Payment failed: '+data.error);setPaying(false)}
    }catch(e){alert('Something went wrong');setPaying(false)}
  }

  const filtered=groups.filter(g=>{
    return(!search||g.name?.toLowerCase().includes(search.toLowerCase()))
      &&(uni==='All Universities'||g.university===uni)
      &&(cat==='All Categories'||g.category===cat)
  })

  const inp:React.CSSProperties={width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',boxSizing:'border-box',color:'#0f172a'}

  return(
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'26px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>WhatsApp Groups</h1>
          <p style={{color:'#64748b',fontSize:'14px'}}>{filtered.length} groups across Kenyan universities</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'11px 22px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}}>
          + Add Group — KES 100
        </button>
      </div>

      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'24px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groups..." style={{flex:1,minWidth:'180px',...inp}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={uni} onChange={e=>setUni(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#374151'}}>
          {UNIS.map(u=><option key={u}>{u}</option>)}
        </select>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#374151'}}>
          {CATS.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px'}}>
          {[1,2,3].map(i=><div key={i} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',height:'160px'}}/>)}
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:'80px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No groups yet</p>
          <p style={{fontSize:'14px',color:'#94a3b8',marginBottom:'20px'}}>Be the first to add a group for your university</p>
          <button onClick={()=>setShowAdd(true)} style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'11px 24px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',border:'none',cursor:'pointer'}}>Add a Group</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'14px'}}>
          {filtered.map(g=>(
            <div key={g.id} style={{background:'#fff',borderRadius:'14px',border:`1px solid ${g.is_featured?'#ddd6fe':'#e2e8f0'}`,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)'}}>
              {g.is_featured&&<div style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'5px',letterSpacing:'0.5px'}}>FEATURED</div>}
              <div style={{padding:'18px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <h3 style={{fontWeight:'700',color:'#0f172a',fontSize:'15px',lineHeight:'1.3',flex:1,marginRight:'8px'}}>{g.name}</h3>
                  {g.is_verified&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'700',border:'1px solid #bbf7d0',flexShrink:0}}>Verified</span>}
                </div>
                <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'10px'}}>
                  <span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'600'}}>{g.university?.split(' ').slice(0,2).join(' ')}</span>
                  <span style={{background:'#f1f5f9',color:'#475569',fontSize:'11px',padding:'2px 7px',borderRadius:'50px'}}>{g.category}</span>
                </div>
                {g.description&&<p style={{fontSize:'13px',color:'#64748b',marginBottom:'12px',lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{g.description}</p>}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'12px',color:'#94a3b8'}}>{g.member_count} members</span>
                  <a href={g.whatsapp_link} target="_blank" rel="noopener noreferrer"
                    style={{background:'#16a34a',color:'#fff',padding:'7px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>Join</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'460px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
              <h2 style={{fontSize:'18px',fontWeight:'800',color:'#0f172a'}}>Add WhatsApp Group</h2>
              <button onClick={()=>setShowAdd(false)} style={{background:'#f1f5f9',border:'none',borderRadius:'8px',padding:'6px 10px',cursor:'pointer',fontSize:'16px',color:'#64748b'}}>✕</button>
            </div>
            <p style={{fontSize:'13px',color:'#64748b',marginBottom:'20px'}}>Pay KES 100 via M-Pesa. Your group goes live automatically after payment.</p>
            <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Group Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. UoN CS Students 2024" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp Invite Link *</label>
                <input value={form.whatsapp_link} onChange={set('whatsapp_link')} placeholder="https://chat.whatsapp.com/..." required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="What is this group about?" rows={2} style={{...inp,resize:'none'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                  <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University *</label>
                  <select value={form.university} onChange={set('university')} required style={inp}>
                    <option value="">Select...</option>
                    {UNIS.slice(1).map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Category</label>
                  <select value={form.category} onChange={set('category')} style={inp}>
                    {CATS.slice(1).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Current Members</label>
                <input type="number" value={form.member_count} onChange={set('member_count')} placeholder="0" style={inp}/>
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{flex:1,border:'1.5px solid #e2e8f0',background:'#fff',color:'#64748b',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={paying} style={{flex:2,background:paying?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:paying?'not-allowed':'pointer'}}>
                  {paying?'Redirecting...':'Pay KES 100 & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
