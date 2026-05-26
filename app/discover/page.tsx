'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

const MOCK = [
  {id:'1',full_name:'Amina Wanjiku',university:'University of Nairobi',course:'Computer Science',year_of_study:'2',is_premium:true,is_featured:true,avatar_url:null},
  {id:'2',full_name:'Brian Ochieng',university:'Kenyatta University',course:'Business Administration',year_of_study:'3',is_top_student:true,avatar_url:null},
  {id:'3',full_name:'Catherine Muthoni',university:'Strathmore University',course:'Law',year_of_study:'1',avatar_url:null},
  {id:'4',full_name:'Dennis Kipchoge',university:'JKUAT',course:'Engineering',year_of_study:'4',is_premium:true,avatar_url:null},
  {id:'5',full_name:'Esther Akinyi',university:'Moi University',course:'Medicine',year_of_study:'5',avatar_url:null},
  {id:'6',full_name:'Felix Njoroge',university:'Africa Nazarene University',course:'Mathematics',year_of_study:'2',avatar_url:null},
]
const UNIS = ['All Universities','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Technical University of Kenya','Maseno University','Dedan Kimathi University']
const YEARS = ['All Years','1','2','3','4','5','6']

function isOnline(t:string|null){return t?(Date.now()-new Date(t).getTime())<5*60*1000:false}
function initials(n:string){return n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)}

export default function DiscoverPage(){
  const [students,setStudents]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [uni,setUni]=useState('All Universities')
  const [year,setYear]=useState('All Years')
  const [status,setStatus]=useState('All')

  useEffect(()=>{
    createClient().from('profiles').select('id,full_name,university,course,year_of_study,avatar_url,is_premium,is_featured,is_top_student,interests,status,last_seen')
      .order('is_featured',{ascending:false}).then(({data,error})=>{
        setStudents(!error&&data&&data.length>0?data:MOCK)
        setLoading(false)
      })
  },[])

  const filtered = students.filter(s=>{
    const q=search.toLowerCase()
    const matchSearch=!q||s.full_name?.toLowerCase().includes(q)||s.course?.toLowerCase().includes(q)
    const matchUni=uni==='All Universities'||s.university===uni
    const matchYear=year==='All Years'||String(s.year_of_study)===year
    const matchStatus=status==='All'||s.status===status
    return matchSearch&&matchUni&&matchYear&&matchStatus
  })

  const sel:React.CSSProperties={width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'#fff',color:'#0f172a'}

  return(
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'32px 20px'}}>
      <h1 style={{fontSize:'26px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Browse Students</h1>
      <p style={{color:'#64748b',fontSize:'14px',marginBottom:'28px'}}>{filtered.length} students found</p>

      <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
        {/* Filters */}
        <aside style={{width:'200px',flexShrink:0}}>
          <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',position:'sticky',top:'72px'}}>
            <p style={{fontSize:'13px',fontWeight:'700',color:'#0f172a',marginBottom:'14px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Filters</p>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#64748b',display:'block',marginBottom:'5px'}}>University</label>
              <select value={uni} onChange={e=>setUni(e.target.value)} style={sel}>
                {UNIS.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#64748b',display:'block',marginBottom:'5px'}}>Year</label>
              <select value={year} onChange={e=>setYear(e.target.value)} style={sel}>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={()=>{setUni('All Universities');setYear('All Years');setSearch('')}} style={{width:'100%',background:'none',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'8px',fontSize:'13px',color:'#64748b',cursor:'pointer'}}>Clear</button>
          </div>
        </aside>

        <div style={{flex:1,minWidth:0}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or course..."
            style={{width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 16px',fontSize:'14px',outline:'none',marginBottom:'20px',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>

          {loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px'}}>
              {[1,2,3,4,5,6].map(i=><div key={i} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',height:'220px',animation:'pulse 1.5s ease infinite'}}/>)}
            </div>
          ) : filtered.length===0 ? (
            <div style={{textAlign:'center',padding:'60px',color:'#94a3b8'}}>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#374151'}}>No students found</p>
              <p style={{fontSize:'14px',marginTop:'4px'}}>Try different filters</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px'}}>
              {filtered.map(s=>(
                <div key={s.id} style={{background:'#fff',borderRadius:'14px',border:`1px solid ${s.is_featured?'#c4b5fd':s.is_top_student?'#fed7aa':'#e2e8f0'}`,overflow:'hidden',transition:'box-shadow 0.2s,transform 0.2s'}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)'}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow='none';(e.currentTarget as HTMLElement).style.transform='none'}}>
                  {s.is_featured&&<div style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)',color:'#fff',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'5px',letterSpacing:'0.5px'}}>FEATURED</div>}
                  {s.is_top_student&&!s.is_featured&&<div style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'5px',letterSpacing:'0.5px'}}>TOP STUDENT</div>}
                  <div style={{padding:'18px'}}>
                    <div style={{display:'flex',gap:'12px',alignItems:'flex-start',marginBottom:'12px'}}>
                      <div style={{position:'relative',flexShrink:0}}>
                        {s.avatar_url
                          ?<img src={s.avatar_url} style={{width:'44px',height:'44px',borderRadius:'50%',objectFit:'cover'}}/>
                          :<div style={{width:'44px',height:'44px',borderRadius:'50%',background:s.is_premium?'#f5f3ff':'#fff7ed',color:s.is_premium?'#7c3aed':'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'14px'}}>{initials(s.full_name||'?')}</div>
                        }
                        {isOnline(s.last_seen)&&<div style={{position:'absolute',bottom:'1px',right:'1px',width:'12px',height:'12px',background:'#22c55e',borderRadius:'50%',border:'2px solid #fff',zIndex:1}}/>}
                      </div>
                      <div>
                        <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',lineHeight:'1.3'}}>{s.full_name}</p>
                        <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'5px'}}>
                          <span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'600'}}>Y{s.year_of_study}</span>
                          {s.is_premium&&<span style={{background:'#f5f3ff',color:'#7c3aed',fontSize:'11px',padding:'2px 7px',borderRadius:'50px',fontWeight:'600'}}>Premium</span>}
                        </div>
                      </div>
                    </div>
                    <p style={{fontSize:'12px',color:'#64748b',marginBottom:'3px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.course}</p>
                    <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'14px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.university}</p>
                    <div style={{display:'flex',gap:'7px'}}>
                      <Link href={`/profile/${s.id}`} style={{flex:1,textAlign:'center',border:'1px solid #e2e8f0',color:'#374151',padding:'8px',borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>View</Link>
                      <Link href={`/profile/${s.id}#unlock`} style={{flex:1,textAlign:'center',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'8px',borderRadius:'8px',fontSize:'13px',fontWeight:'600'}}>Connect</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
