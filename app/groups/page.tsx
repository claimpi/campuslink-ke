'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

const CATS = ['All','Dating','Friendship','Study','Networking','Entertainment','Sports','Business','Technology','Other']

export default function GroupsPage(){
  const router = useRouter()
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [paying, setPaying] = useState(false)
  const [form, setForm] = useState({name:'',whatsapp_link:'',description:'',category:'Dating',member_count:'0'})
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    createClient().from('whatsapp_groups').select('*').eq('payment_status','approved')
      .order('is_featured',{ascending:false})
      .then(({data,error})=>{ setGroups(!error&&data?data:[]); setLoading(false) })
  },[])

  async function handleAdd(e:React.FormEvent){
    e.preventDefault()
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    if(!user){router.push('/login');return}
    if(!form.name||!form.whatsapp_link){alert('Fill all required fields');return}
    setPaying(true)
    try{
      const {data:group,error} = await sb.from('whatsapp_groups').insert([{
        name:form.name, whatsapp_link:form.whatsapp_link, description:form.description,
        category:form.category, member_count:parseInt(form.member_count)||0,
        added_by:user.id, payment_status:'pending', is_verified:false, is_featured:false
      }]).select().single()
      if(error){alert('Error: '+error.message);setPaying(false);return}
      const {data:curr} = await sb.from('profiles').select('full_name,whatsapp_number').eq('id',user.id).maybeSingle()
      const res = await fetch('/api/pesapal',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId:user.id,userEmail:user.email,userName:curr?.full_name||user.email,phone:curr?.whatsapp_number||'',paymentType:'add_group',groupId:group.id})})
      const data = await res.json()
      if(data.redirectUrl) window.location.href=data.redirectUrl
      else{alert('Payment failed: '+data.error);setPaying(false)}
    }catch{alert('Something went wrong');setPaying(false)}
  }

  const filtered = groups.filter(g=>{
    const q = search.toLowerCase()
    const matchSearch = !q||g.name?.toLowerCase().includes(q)||g.description?.toLowerCase().includes(q)
    const matchCat = cat==='All'||g.category===cat
    return matchSearch&&matchCat
  })

  const inp:React.CSSProperties = {width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#0f172a',boxSizing:'border-box'}

  return(
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'24px 16px'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>WhatsApp Groups</h1>
          <p style={{fontSize:'13px',color:'#94a3b8'}}>Join groups and meet new people</p>
        </div>
        <button onClick={()=>setShowAdd(!showAdd)}
          style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:'10px',padding:'10px 20px',fontSize:'14px',fontWeight:'700',cursor:'pointer',boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}}>
          + List Your Group
        </button>
      </div>

      {/* Add Group Form */}
      {showAdd&&(
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0',padding:'24px',marginBottom:'24px',boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
          <h2 style={{fontSize:'18px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>List Your WhatsApp Group</h2>
          <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'20px'}}>Pay KES 100 via M-Pesa to list your group. Auto-published after payment.</p>
          <form onSubmit={handleAdd} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Group Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Nairobi Singles Connect" required style={inp}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp Link *</label>
                <input value={form.whatsapp_link} onChange={set('whatsapp_link')} placeholder="https://chat.whatsapp.com/..." required style={inp}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Category</label>
                <select value={form.category} onChange={set('category')} style={inp}>
                  {CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Members</label>
                <input type="number" value={form.member_count} onChange={set('member_count')} placeholder="0" style={inp}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Description</label>
                <textarea value={form.description} onChange={set('description')} rows={2} placeholder="What is this group about?" style={{...inp,resize:'none'}}/>
              </div>
            </div>
            <button type="submit" disabled={paying}
              style={{background:paying?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:paying?'not-allowed':'pointer',boxShadow:paying?'none':'0 4px 12px rgba(249,115,22,0.3)'}}>
              {paying?'Redirecting to M-Pesa...':'Pay KES 100 to List Group'}
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groups..."
          style={{flex:1,minWidth:'180px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 14px',fontSize:'14px',outline:'none',background:'#fff'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              style={{padding:'8px 14px',borderRadius:'50px',fontSize:'12px',fontWeight:'600',border:'1.5px solid',cursor:'pointer',transition:'all 0.15s',
                background:cat===c?'linear-gradient(135deg,#f97316,#ea580c)':'#fff',
                color:cat===c?'#fff':'#64748b',
                borderColor:cat===c?'#f97316':'#e2e8f0'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Grid */}
      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px'}}>
          {[...Array(6)].map((_,i)=><div key={i} style={{height:'180px',background:'#f1f5f9',borderRadius:'14px'}}/>)}
        </div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No groups found</p>
          <p style={{fontSize:'14px',color:'#94a3b8',marginBottom:'20px'}}>Be the first to list a group!</p>
          <button onClick={()=>setShowAdd(true)} style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',border:'none',borderRadius:'10px',padding:'10px 24px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>List a Group</button>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'14px'}}>
          {filtered.map(g=>(
            <div key={g.id} style={{background:'#fff',borderRadius:'16px',border:`1px solid ${g.is_featured?'#fed7aa':'#e2e8f0'}`,padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.04)',transition:'transform 0.15s,box-shadow 0.15s',display:'flex',flexDirection:'column',gap:'12px'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.08)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'}}>

              {/* Top */}
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'8px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px',flexWrap:'wrap'}}>
                    {g.is_featured&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'10px',padding:'2px 8px',borderRadius:'50px',fontWeight:'700',border:'1px solid #fed7aa'}}>Featured</span>}
                    {g.is_verified&&<span style={{background:'#eff6ff',color:'#2563eb',fontSize:'10px',padding:'2px 8px',borderRadius:'50px',fontWeight:'700',border:'1px solid #bfdbfe'}}>Verified</span>}
                    <span style={{background:'#f8fafc',color:'#64748b',fontSize:'10px',padding:'2px 8px',borderRadius:'50px',border:'1px solid #e2e8f0'}}>{g.category}</span>
                  </div>
                  <p style={{fontWeight:'700',color:'#0f172a',fontSize:'15px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name}</p>
                </div>
                <div style={{background:'#f0fdf4',borderRadius:'10px',padding:'6px 10px',textAlign:'center',flexShrink:0}}>
                  <p style={{fontSize:'14px',fontWeight:'800',color:'#16a34a'}}>{g.member_count||0}</p>
                  <p style={{fontSize:'9px',color:'#16a34a',fontWeight:'600'}}>members</p>
                </div>
              </div>

              {g.description&&<p style={{fontSize:'13px',color:'#64748b',lineHeight:'1.5',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{g.description}</p>}

              <a href={g.whatsapp_link} target="_blank" rel="noopener noreferrer"
                style={{display:'block',background:'#16a34a',color:'#fff',padding:'11px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',textAlign:'center',textDecoration:'none',boxShadow:'0 2px 8px rgba(22,163,74,0.3)',marginTop:'auto'}}>
                Join Group
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
