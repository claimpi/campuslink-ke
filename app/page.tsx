'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const UNIS=['All','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Technical University of Kenya','Maseno University','Dedan Kimathi University']
const YEARS=['All Years','1','2','3','4','5','6']

function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}
function isOnline(t:string|null):boolean{return t?(Date.now()-new Date(t).getTime())<5*60*1000:false}

export default function HomePage(){
  const router=useRouter()
  const [students,setStudents]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [uni,setUni]=useState('All')
  const [year,setYear]=useState('All Years')
  const [status,setStatus]=useState('All')
  const [announcements,setAnnouncements]=useState<any[]>([])

  const loadStudents=()=>{
    createClient().from('profiles')
      .select('id,full_name,university,course,year_of_study,avatar_url,is_premium,is_featured,is_top_student,interests,status,last_seen')
      .order('is_featured',{ascending:false}).order('is_premium',{ascending:false})
      .then(({data,error})=>{ if(!error&&data&&data.length>0) setStudents(data); setLoading(false) })
  }

  useEffect(()=>{
    createClient().from('announcements').select('*').order('created_at',{ascending:false}).limit(3)
      .then(({data})=>{ if(data&&data.length>0) setAnnouncements(data) })
    loadStudents()
    const interval=setInterval(loadStudents,30000)
    return ()=>clearInterval(interval)
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
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px 16px'}}>

      {/* Announcements */}
      {announcements.map(a=>(
        <div key={a.id} style={{background:'#fff',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',marginBottom:'10px',display:'flex',alignItems:'flex-start',gap:'10px'}}>
          <span style={{fontSize:'16px',flexShrink:0}}>🔔</span>
          <div style={{flex:1,minWidth:0}}>
            <span style={{fontWeight:'700',color:'#0f172a',fontSize:'14px'}}>{a.title}</span>
            {a.content&&<p style={{fontSize:'13px',color:'#64748b',marginTop:'2px',lineHeight:'1.5'}}>{a.content}</p>}
          </div>
          <button onClick={()=>setAnnouncements(aa=>aa.filter(x=>x.id!==a.id))} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:'16px',flexShrink:0}}>✕</button>
        </div>
      ))}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>Students</h1>
          <p style={{fontSize:'13px',color:'#94a3b8'}}>{filtered.length} students across Kenyan universities</p>
        </div>
        <Link href="/register" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'9px 20px',borderRadius:'8px',fontWeight:'600',fontSize:'13px',boxShadow:'0 2px 8px rgba(249,115,22,0.3)'}}>Join Free</Link>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'20px'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, course or university..."
          style={{flex:1,minWidth:'200px',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#0f172a'}}
          onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        <select value={uni} onChange={e=>setUni(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          {UNIS.map(u=><option key={u}>{u}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          {YEARS.map(y=><option key={y}>{y}</option>)}
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'9px 12px',fontSize:'13px',outline:'none',background:'#fff',color:'#374151',cursor:'pointer'}}>
          <option value="All">All Status</option>
          <option value="single">💚 Single</option>
          <option value="taken">❤️ Taken</option>
          <option value="complicated">🤔 Complicated</option>
        </select>
      </div>

      {/* Grid */}
      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
          {[...Array(8)].map((_,i)=><div key={i} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',height:'160px',opacity:0.5}}/>)}
        </div>
      ):(
        <>
          <style>{`@media(max-width:640px){.sgrid{grid-template-columns:1fr 1fr!important;gap:8px!important}.scard-inner{padding:10px!important}.sname{font-size:12px!important}.sbtn{padding:6px!important;font-size:11px!important}.shide{display:none!important}}`}</style>
          {filtered.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px',background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0'}}>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'6px'}}>No students found</p>
              <p style={{fontSize:'14px',color:'#94a3b8'}}>Try a different search or filter</p>
            </div>
          ):(
            <div className="sgrid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
              {filtered.map(s=>(
                <div key={s.id} style={{background:'#fff',borderRadius:'14px',border:`1px solid ${s.is_featured?'#fed7aa':s.is_top_student?'#fed7aa':'#e2e8f0'}`,overflow:'hidden',transition:'transform 0.15s,box-shadow 0.15s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>

                  {s.is_featured&&<div style={{background:'#fff7ed',color:'#ea580c',fontSize:'10px',fontWeight:'700',textAlign:'center',padding:'4px',letterSpacing:'0.5px',borderBottom:'1px solid #fed7aa'}}>FEATURED</div>}
                  {s.is_top_student&&!s.is_featured&&<div style={{background:'#fff7ed',color:'#ea580c',fontSize:'10px',fontWeight:'700',textAlign:'center',padding:'4px',letterSpacing:'0.5px',borderBottom:'1px solid #fed7aa'}}>TOP STUDENT</div>}

                  <div className="scard-inner" style={{padding:'12px'}}>
                    {/* Card row: avatar + info */}
                    <div style={{display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:'10px'}}>
                      <div style={{position:'relative',flexShrink:0}}>
                        {s.avatar_url
                          ?<img src={s.avatar_url} style={{width:'48px',height:'48px',borderRadius:'10px',objectFit:'cover'}}/>
                          :<div style={{width:'48px',height:'48px',borderRadius:'10px',background:s.is_top_student?'#fff7ed':'#f1f5f9',color:s.is_top_student?'#ea580c':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'15px'}}>{initials(s.full_name)}</div>
                        }
                        {isOnline(s.last_seen)&&<div style={{position:'absolute',bottom:'1px',right:'1px',width:'10px',height:'10px',background:'#22c55e',borderRadius:'50%',border:'2px solid #fff'}}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <p className="sname" style={{fontWeight:'700',color:'#0f172a',fontSize:'13px',marginBottom:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.full_name}</p>
                        <p className="shide" style={{fontSize:'11px',color:'#64748b',marginBottom:'1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.course}</p>
                        <p className="shide" style={{fontSize:'10px',color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.university}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div style={{display:'flex',flexWrap:'wrap',gap:'4px',marginBottom:'10px'}}>
                      <span style={{background:'#f8fafc',color:'#64748b',fontSize:'10px',padding:'2px 6px',borderRadius:'50px',border:'1px solid #e2e8f0'}}>Y{s.year_of_study}</span>
                      {s.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'10px',padding:'2px 6px',borderRadius:'50px',border:'1px solid #ddd6fe',fontWeight:'600'}}>Pro</span>}
                      {s.status==='single'&&<span style={{background:'#f0fdf4',color:'#16a34a',fontSize:'10px',padding:'2px 6px',borderRadius:'50px',border:'1px solid #bbf7d0',fontWeight:'600'}}>💚 Single</span>}
                      {s.status==='taken'&&<span style={{background:'#fef2f2',color:'#dc2626',fontSize:'10px',padding:'2px 6px',borderRadius:'50px',border:'1px solid #fecaca',fontWeight:'600'}}>❤️ Taken</span>}
                      {s.status==='complicated'&&<span style={{background:'#fff7ed',color:'#ea580c',fontSize:'10px',padding:'2px 6px',borderRadius:'50px',border:'1px solid #fed7aa',fontWeight:'600'}}>🤔</span>}
                    </div>

                    {/* Buttons */}
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>router.push(`/profile/${s.id}`)}
                        className="sbtn" style={{flex:1,padding:'7px',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#fff',color:'#374151',fontSize:'12px',fontWeight:'600',cursor:'pointer'}}>
                        View
                      </button>
                      <button onClick={()=>router.push(`/profile/${s.id}`)}
                        className="sbtn" style={{flex:1,padding:'7px',borderRadius:'8px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:'12px',fontWeight:'700',border:'none',cursor:'pointer'}}>
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
