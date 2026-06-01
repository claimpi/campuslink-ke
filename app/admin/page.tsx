'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

function AnnouncementsList(){
  const [anns,setAnns]=useState<any[]>([])
  useEffect(()=>{
    createClient().from('announcements').select('*').order('created_at',{ascending:false}).then(({data}:any)=>setAnns(data||[]))
  },[])
  async function del(id:string){
    await createClient().from('announcements').delete().eq('id',id)
    setAnns(a=>a.filter(x=>x.id!==id))
  }
  if(anns.length===0) return <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'8px'}}>No announcements yet.</p>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'4px'}}>
      <p style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',marginBottom:'4px'}}>Posted Announcements</p>
      {anns.map(a=>(
        <div key={a.id} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
          <span style={{fontSize:'15px'}}></span>
          <div style={{flex:1}}>
            <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</p>
            <p style={{fontSize:'12px',color:'#64748b',marginTop:'2px'}}>{a.content}</p>
          </div>
          <button onClick={()=>del(a.id)} style={{background:'#fef2f2',border:'none',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',fontSize:'12px',color:'#dc2626',fontWeight:'600',flexShrink:0}}>Delete</button>
        </div>
      ))}
    </div>
  )
}

type Tab = 'users'|'payments'|'groups'|'announce'

export default function AdminPage(){
  const router=useRouter()
  const [tab,setTab]=useState<Tab>('users')
  const [users,setPeople]=useState<any[]>([])
  const [payments,setPayments]=useState<any[]>([])
  const [groups,setGroups]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [ann,setAnn]=useState({title:'',content:''})
  const [posting,setPosting]=useState(false)

  useEffect(()=>{loadAll()},[])

  async function loadAll(){
    setLoading(true)
    const sb=createClient()
    const [{data:s},{data:p},{data:g}]=await Promise.all([
      sb.from('profiles').select('id,full_name,email,university,course,year_of_study,is_premium,is_featured,is_verified').order('created_at',{ascending:false}),
      sb.from('payment_requests').select('*').order('created_at',{ascending:false}).limit(50),
      sb.from('whatsapp_groups').select('*').order('created_at',{ascending:false}),
    ])
    setPeople(s||[]);setPayments(p||[]);setGroups(g||[])
    setLoading(false)
  }

  async function toggleBadge(id:string,field:string,val:boolean){
    await createClient().from('profiles').update({[field]:!val}).eq('id',id)
    setPeople(ss=>ss.map(s=>s.id===id?{...s,[field]:!val}:s))
  }

  async function approveGift(id:string,userId:string,targetId:string,amount:number,giftType:string){
    const sb=createClient()
    await sb.from('payment_requests').update({status:'approved'}).eq('id',id)
    // Credit receiver
    const {data:recv}=await sb.from('profiles').select('gift_earnings').eq('id',targetId).maybeSingle()
    await fetch('/api/admin/update-user',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:targetId,field:'gift_earnings',value:(recv?.gift_earnings||0)+amount})})
    // Insert into gifts table
    await sb.from('gifts').insert([{sender_id:userId,receiver_id:targetId,gift_type:giftType,amount}])
    setPayments(pp=>pp.map(p=>p.id===id?{...p,status:'approved'}:p))
  }

  async function approveWithdrawal(id:string){
    await fetch('/api/admin/update-user',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:id,field:'withdrawal_status',value:'paid'})})
    setPayments(pp=>pp.map(p=>p.id===id?{...p,status:'approved'}:p))
  }

  async function approvePayment(id:string,userId:string,type:string){
    // Update payment status
    await createClient().from('payment_requests').update({status:'approved'}).eq('id',id)
    // Update profile badge via server API
    const field = type==='premium'?'is_premium':type==='featured'?'is_featured':type==='verified'?'is_verified':null
    if(field){
      await fetch('/api/admin/update-user',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({userId,field,value:true})})
    }
    setPayments(pp=>pp.map(p=>p.id===id?{...p,status:'approved'}:p))
  }

  async function rejectPayment(id:string){
    await createClient().from('payment_requests').update({status:'rejected'}).eq('id',id)
    setPayments(pp=>pp.map(p=>p.id===id?{...p,status:'rejected'}:p))
  }

  async function deleteUser(id:string){
    if(!confirm('Delete this user? This cannot be undone.')) return
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id })
    })
    if (res.ok) {
      setPeople(ss=>ss.filter(s=>s.id!==id))
    } else {
      const data = await res.json()
      alert('Delete failed: ' + (data.error || 'Unknown error'))
    }
  }

  async function approveGroup(id:string){
    await createClient().from('whatsapp_groups').update({payment_status:'approved',is_verified:true}).eq('id',id)
    setGroups(gg=>gg.map(g=>g.id===id?{...g,payment_status:'approved',is_verified:true}:g))
  }

  async function deleteGroup(id:string){
    await createClient().from('whatsapp_groups').delete().eq('id',id)
    setGroups(gg=>gg.filter(g=>g.id!==id))
  }

  async function postAnnouncement(e:React.FormEvent){
    e.preventDefault();setPosting(true)
    await createClient().from('announcements').insert([ann])
    setAnn({title:'',content:''});setPosting(false);alert('Posted!')
  }

  async function logout(){
    await fetch('/api/admin-auth',{method:'DELETE'})
    router.push('/admin/login')
  }

  const pendingPayments=payments.filter(p=>p.status==='pending').length
  const stats=[{l:'People',v:users.length},{l:'Premium',v:users.filter(s=>s.is_premium).length},{l:'Featured',v:users.filter(s=>s.is_featured).length},{l:'Pending',v:pendingPayments}]

  const tabStyle=(t:Tab):React.CSSProperties=>({padding:'9px 18px',borderRadius:'8px',fontSize:'14px',fontWeight:'600',border:'none',cursor:'pointer',background:tab===t?'#fff':'transparent',color:tab===t?'#0f172a':'#64748b',boxShadow:tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none',transition:'all 0.2s'})

  return(
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 20px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>Admin Dashboard</h1>
          <p style={{color:'#64748b',fontSize:'13px'}}>CampusLink KE Management</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={loadAll} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',color:'#374151',cursor:'pointer',fontWeight:'600'}}>Refresh</button>
          <button onClick={logout} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>Sign Out</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
        {stats.map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'18px 16px'}}>
            <div style={{fontSize:'24px',fontWeight:'900',color:'#0f172a',marginBottom:'2px'}}>{s.v}</div>
            <div style={{fontSize:'12px',color:'#94a3b8'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{background:'#f8fafc',borderRadius:'10px',padding:'4px',display:'flex',gap:'2px',marginBottom:'20px',flexWrap:'wrap'}}>
        <button onClick={()=>setTab('users')} style={tabStyle('users')}>People</button>
        <button onClick={()=>setTab('payments')} style={tabStyle('payments')}>
          Payments {pendingPayments>0&&<span style={{background:'#dc2626',color:'#fff',fontSize:'10px',padding:'1px 5px',borderRadius:'50px',marginLeft:'4px'}}>{pendingPayments}</span>}
        </button>
        <button onClick={()=>setTab('groups')} style={tabStyle('groups')}>Groups</button>
        <button onClick={()=>setTab('announce')} style={tabStyle('announce')}>Announce</button>
      </div>

      {loading?<div style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>Loading...</div>:(<>

      {tab==='users'&&(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {users.length===0?<p style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>No users yet</p>:
          users.map(s=>(
            <div key={s.id} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
              <div>
                <p style={{fontWeight:'600',color:'#0f172a',fontSize:'14px'}}>{s.full_name}</p>
                <p style={{fontSize:'12px',color:'#94a3b8'}}>{s.course} · {s.university}</p>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
                {s.is_verified&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'700',border:'1px solid #fed7aa'}}>Top</span>}
                {s.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'700',border:'1px solid #ddd6fe'}}>Pro</span>}
                {s.is_featured&&<span style={{background:'#eff6ff',color:'#2563eb',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'700',border:'1px solid #bfdbfe'}}>Feat</span>}
                <span style={{background:'#f1f5f9',color:'#64748b',fontSize:'11px',padding:'2px 7px',borderRadius:'50px'}}>Y{s.year_of_study}</span>
                <div style={{display:'flex',gap:'4px'}}>
                  <button onClick={()=>toggleBadge(s.id,'is_verified',s.is_verified)} title="Toggle Top" style={{background:'#fff7ed',border:'none',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',fontSize:'12px'}}></button>
                  <button onClick={()=>toggleBadge(s.id,'is_premium',s.is_premium)} title="Toggle Premium" style={{background:'#f5f3ff',border:'none',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',fontSize:'12px'}}></button>
                  <button onClick={()=>toggleBadge(s.id,'is_featured',s.is_featured)} title="Toggle Featured" style={{background:'#eff6ff',border:'none',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',fontSize:'12px'}}></button>
                  <button onClick={()=>deleteUser(s.id)} title="Delete" style={{background:'#fef2f2',border:'none',borderRadius:'6px',padding:'5px 8px',cursor:'pointer',fontSize:'12px',color:'#dc2626'}}></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='payments'&&(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {payments.length===0?<p style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>No payments yet</p>:
          payments.map(p=>(
            <div key={p.id} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
              <div>
                <p style={{fontWeight:'600',color:'#0f172a',fontSize:'14px'}}>{p.type} — KES {p.amount}</p>
                <p style={{fontSize:'12px',color:'#94a3b8'}}>{p.reference} · {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <span style={{fontSize:'12px',padding:'3px 9px',borderRadius:'50px',fontWeight:'600',background:p.status==='approved'?'#f0fdf4':p.status==='rejected'?'#fef2f2':'#fefce8',color:p.status==='approved'?'#16a34a':p.status==='rejected'?'#dc2626':'#ca8a04'}}>{p.status}</span>
                {p.status==='pending'&&<>
                  <button onClick={()=>approvePayment(p.id,p.user_id,p.type)} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'6px 12px',fontSize:'13px',fontWeight:'600',color:'#16a34a',cursor:'pointer'}}>Approve</button>
                  <button onClick={()=>rejectPayment(p.id)} style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'6px 12px',fontSize:'13px',fontWeight:'600',color:'#dc2626',cursor:'pointer'}}>Reject</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='groups'&&(
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {groups.length===0?<p style={{textAlign:'center',padding:'40px',color:'#94a3b8'}}>No groups yet</p>:
          groups.map(g=>(
            <div key={g.id} style={{background:'#fff',borderRadius:'12px',border:'1px solid #e2e8f0',padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}}>
              <div>
                <p style={{fontWeight:'600',color:'#0f172a',fontSize:'14px'}}>{g.name}</p>
                <p style={{fontSize:'12px',color:'#94a3b8'}}>{g.university} · {g.category}</p>
              </div>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <span style={{fontSize:'12px',padding:'3px 9px',borderRadius:'50px',fontWeight:'600',background:g.payment_status==='approved'?'#f0fdf4':'#fefce8',color:g.payment_status==='approved'?'#16a34a':'#ca8a04'}}>{g.payment_status||'pending'}</span>
                {g.payment_status!=='approved'&&<button onClick={()=>approveGroup(g.id)} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'6px 12px',fontSize:'13px',fontWeight:'600',color:'#16a34a',cursor:'pointer'}}>Approve</button>}
                <button onClick={()=>deleteGroup(g.id)} style={{background:'#fef2f2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',color:'#dc2626',cursor:'pointer',fontWeight:'600'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='announce'&&(
        <div>
        {/* Existing announcements */}
        <AnnouncementsList/>
        <form onSubmit={postAnnouncement} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'24px',display:'flex',flexDirection:'column',gap:'14px',maxWidth:'560px',marginTop:'16px'}}>
          <h2 style={{fontSize:'16px',fontWeight:'700',color:'#0f172a'}}>Post New Announcement</h2>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Title</label>
            <input value={ann.title} onChange={e=>setAnn(a=>({...a,title:e.target.value}))} required style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',boxSizing:'border-box'}} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Message</label>
            <textarea value={ann.content} onChange={e=>setAnn(a=>({...a,content:e.target.value}))} required rows={4} style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',resize:'none',boxSizing:'border-box'}} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
          <button type="submit" disabled={posting} style={{background:posting?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:posting?'not-allowed':'pointer'}}>
            {posting?'Posting...':'Post Announcement'}
          </button>
        </form>
        </div>
      )}
      </>)}
    </div>
  )
}
