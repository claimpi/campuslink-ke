'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const MOCK = [
  {id:'1',full_name:'Amina Wanjiku',university:'University of Nairobi',course:'Computer Science',year_of_study:'2',is_premium:true,is_featured:true,avatar_url:null,interests:['coding','AI']},
  {id:'2',full_name:'Brian Ochieng',university:'Kenyatta University',course:'Business Administration',year_of_study:'3',is_top_student:true,avatar_url:null,interests:['football','chess']},
  {id:'3',full_name:'Catherine Muthoni',university:'Strathmore University',course:'Law',year_of_study:'1',avatar_url:null,interests:['debate','reading']},
  {id:'4',full_name:'Dennis Kipchoge',university:'JKUAT',course:'Engineering',year_of_study:'4',is_premium:true,avatar_url:null,interests:['robotics']},
  {id:'5',full_name:'Esther Akinyi',university:'Moi University',course:'Medicine',year_of_study:'5',avatar_url:null,interests:['research']},
  {id:'6',full_name:'Felix Njoroge',university:'Africa Nazarene University',course:'Mathematics',year_of_study:'2',avatar_url:null,interests:['music']},
  {id:'7',full_name:'Grace Wambui',university:'Technical University of Kenya',course:'Software Engineering',year_of_study:'3',avatar_url:null,interests:['coding','design']},
  {id:'8',full_name:'Henry Mutua',university:'Maseno University',course:'Economics',year_of_study:'2',avatar_url:null,interests:['business']},
]

const UNIS=['All','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Technical University of Kenya','Maseno University','Dedan Kimathi University']
const YEARS=['All Years','1','2','3','4','5','6']

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function isOnline(lastSeen:string|null):boolean{
  if(!lastSeen) return false
  return (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000 // 5 minutes
}

export default function HomePage(){
  const [students,setStudents]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [uni,setUni]=useState('All')
  const [year,setYear]=useState('All Years')
  const [status,setStatus]=useState('All')

  const [announcements,setAnnouncements]=useState<any[]>([])

  useEffect(()=>{
    createClient().from('announcements').select('*').order('created_at',{ascending:false}).limit(3)
      .then(({data})=>{ if(data&&data.length>0) setAnnouncements(data) })
    createClient().from('profiles')
      .select('id,full_name,university,course,year_of_study,avatar_url,is_premium,is_featured,is_top_student,interests,status,last_seen')
      .order('is_featured',{ascending:false})
      .order('is_premium',{ascending:false})
      .then(({data,error})=>{
        setStudents(!error&&data&&data.length>0?data:MOCK)
        setLoading(false)
      })
  },[])

  const filtered=students.filter(s=>{
    const q=search.toLowerCase()
    const matchSearch=!q||s.full_name?.toLowerCase().includes(q)||s.course?.toLowerCase().includes(q)||s.university?.toLowerCase().includes(q)
    const matchUni=uni==='All'||s.university===uni
    const matchYear=year==='All Years'||String(s.year_of_study)===year
    const matchStatus=status==='All'||s.status===status
    return matchSearch&&matchUni&&matchYear&&matchStatus
  })

  return(
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'28px 20px'}}>

      {/* Announcements */}
      {announcements.map(a=>(
        <div key={a.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
          <span style={{fontSize:'16px',flexShrink:0}}>🔔</span>
          <div style={{flex:1,minWidth:0}}>
            <span style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</span>
            {a.content&&<p style={{fontSize:'13px',color:'#64748b',marginTop:'2px',lineHeight:'1.5'}}>{a.content}</p>}
          </div>
          <button onClick={()=>setAnnouncements(aa=>aa.filter(x=>x.id!==a.id))} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'16px',flexShrink:0,padding:'0 2px',lineHeight:'1'}}>✕</button>
        </div>
      ))}

      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>Students</h1>
          <p style={{fontSize:'13px',color:'#94a3b8'}}>{filtered.length} students across Kenyan universities</p>
        </div>
        <Link href="/register" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'9px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}}>Join Free</Link>
      </div>

      {/* Search + filters */}
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'24px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, course or university..."
          style={{flex:1,minWidth:'220px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#0f172a'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={uni} onChange={e=>setUni(e.target.value)}
          style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          {UNIS.map(u=><option key={u}>{u}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(e.target.value)}
          style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          <option value="All">All Status</option>
          <option value="single">💚 Single</option>
          <option value="taken">❤️ Taken</option>
          <option value="complicated">🤔 Complicated</option>
        </select>
      </div>

      {/* Student grid */}
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
          {[...Array(8)].map((_,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',height:'240px',animation:'pulse 1.5s ease infinite'}}/>
          ))}
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:'center',padding:'80px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No students found</p>
          <p style={{fontSize:'14px',color:'#94a3b8'}}>Try a different search or filter</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'14px'}}>
          {filtered.map(s=>(
            <div key={s.id} style={{background:'#fff',borderRadius:'14px',border:`1px solid ${s.is_featured?'#ddd6fe':s.is_top_student?'#fed7aa':'#e2e8f0'}`,overflow:'hidden',transition:'transform 0.15s,box-shadow 0.15s'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              {s.is_featured&&<div style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontSize:'10px',fontWeight:'700',textAlign:'center',padding:'4px',letterSpacing:'0.5px'}}>FEATURED</div>}
              {s.is_top_student&&!s.is_featured&&<div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:'10px',fontWeight:'700',textAlign:'center',padding:'4px',letterSpacing:'0.5px'}}>TOP STUDENT</div>}

              <div style={{padding:'16px'}}>
                {/* Avatar */}
                <div style={{marginBottom:'12px'}}>
                  {s.avatar_url
                    ?<img src={s.avatar_url} style={{width:'52px',height:'52px',borderRadius:'50%',objectFit:'cover',border:'2px solid #f1f5f9'}}/>
                    :<div style={{width:'52px',height:'52px',borderRadius:'50%',background:s.is_premium?'#f5f3ff':s.is_top_student?'#fff7ed':'#f1f5f9',color:s.is_premium?'#7c3aed':s.is_top_student?'#ea580c':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'16px'}}>{initials(s.full_name)}</div>
                  }
                </div>

                <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'2px',lineHeight:'1.3'}}>{s.full_name}</p>
                <p style={{fontSize:'12px',color:'#64748b',marginBottom:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.course}</p>
                <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.university}</p>

                <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'12px'}}>
                  <span style={{background:'#f8fafc',color:'#64748b',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',border:'1px solid #e2e8f0'}}>Year {s.year_of_study}</span>
                  {s.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',border:'1px solid #ddd6fe',fontWeight:'600'}}>Pro</span>}
                  {s.status==='single'&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',border:'1px solid #bbf7d0',fontWeight:'600'}}>💚 Single</span>}
                  {s.status==='taken'&&<span style={{background:'#fef2f2',color:'#dc2626',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',border:'1px solid #fecaca',fontWeight:'600'}}>❤️ Taken</span>}
                  {s.status==='complicated'&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',border:'1px solid #fed7aa',fontWeight:'600'}}>🤔 Complicated</span>}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                  <Link href={`/profile/${s.id}`} style={{textAlign:'center',border:'1px solid #e2e8f0',color:'#374151',padding:'7px',borderRadius:'8px',fontSize:'12px',fontWeight:'600',background:'#f8fafc'}}>View</Link>
                  <Link href={`/profile/${s.id}#unlock`} style={{textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'7px',borderRadius:'8px',fontSize:'12px',fontWeight:'600'}}>Connect</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
