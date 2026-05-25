'use client'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import StudentCard from '@/components/ui/StudentCard'
import { createClient } from '@/lib/supabase-browser'

const MOCK = [
  { id:'1', full_name:'Amina Wanjiku', university:'University of Nairobi', course:'Computer Science', year_of_study:2, interests:['coding','AI'], is_premium:true, is_featured:true },
  { id:'2', full_name:'Brian Ochieng', university:'Kenyatta University', course:'Business Administration', year_of_study:3, interests:['football','chess'], is_top_student:true },
  { id:'3', full_name:'Catherine Muthoni', university:'Strathmore University', course:'Law', year_of_study:1, interests:['reading','debate'] },
  { id:'4', full_name:'Dennis Kipchoge', university:'JKUAT', course:'Mechanical Engineering', year_of_study:4, interests:['robotics','sports'], is_premium:true },
  { id:'5', full_name:'Esther Akinyi', university:'Moi University', course:'Medicine', year_of_study:5, interests:['health','research'] },
  { id:'6', full_name:'Felix Njoroge', university:'Africa Nazarene University', course:'Math', year_of_study:2, interests:['football','music'], is_top_student:true },
]

const UNIVERSITIES = ['All Universities','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Maseno University','Egerton University','Technical University of Kenya','Dedan Kimathi University','Multimedia University']
const YEARS = ['All Years','1','2','3','4','5','6']

type Student = {
  id:string; full_name:string; university:string; course:string;
  year_of_study:number; interests?:string[]; avatar_url?:string;
  is_premium?:boolean; is_featured?:boolean; is_top_student?:boolean;
}

export default function DiscoverPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [university, setUniversity] = useState('All Universities')
  const [year, setYear] = useState('All Years')

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('id,full_name,university,course,year_of_study,interests,avatar_url,is_premium,is_featured,is_top_student')
          .order('is_featured', { ascending: false })
          .order('is_premium', { ascending: false })
        if (!error && data && data.length > 0) {
          setStudents(data)
        } else {
          setStudents(MOCK as Student[])
        }
      } catch {
        setStudents(MOCK as Student[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.full_name?.toLowerCase().includes(q) || s.course?.toLowerCase().includes(q) || (s.interests||[]).some(i=>i.toLowerCase().includes(q))
    const matchUni = university === 'All Universities' || s.university === university
    const matchYear = year === 'All Years' || String(s.year_of_study) === year
    return matchSearch && matchUni && matchYear
  })

  const sel = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'white',cursor:'pointer'}

  return (
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'32px 16px'}}>
      <h1 style={{fontSize:'28px',fontWeight:'900',color:'#111827',marginBottom:'4px'}}>Browse Students</h1>
      <p style={{color:'#9ca3af',marginBottom:'28px',fontSize:'14px'}}>Found {filtered.length} students across Kenyan universities</p>

      <div style={{display:'flex',gap:'24px',flexWrap:'wrap'}}>
        {/* Sidebar */}
        <aside style={{width:'220px',flexShrink:0}}>
          <div style={{background:'white',borderRadius:'18px',border:'1px solid #f3f4f6',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',position:'sticky',top:'80px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'6px',fontWeight:'700',color:'#374151',marginBottom:'18px',fontSize:'14px'}}>
              <Filter size={15}/> Filters
            </div>
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#f97316',display:'block',marginBottom:'6px'}}>UNIVERSITY</label>
              <select value={university} onChange={e=>setUniversity(e.target.value)} style={sel}
                onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}>
                {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#f97316',display:'block',marginBottom:'6px'}}>YEAR OF STUDY</label>
              <select value={year} onChange={e=>setYear(e.target.value)} style={sel}>
                {YEARS.map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={()=>{setUniversity('All Universities');setYear('All Years');setSearch('')}}
              style={{width:'100%',border:'1.5px solid #fed7aa',color:'#f97316',background:'white',padding:'9px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{position:'relative',marginBottom:'20px'}}>
            <Search size={16} style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names, course, interests..."
              style={{width:'100%',paddingLeft:'42px',paddingRight:'16px',paddingTop:'12px',paddingBottom:'12px',border:'1.5px solid #e5e7eb',borderRadius:'14px',fontSize:'14px',outline:'none',background:'white',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',boxSizing:'border-box'}}
              onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
          </div>

          {loading ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'16px'}}>
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} style={{background:'white',borderRadius:'20px',border:'1px solid #f3f4f6',overflow:'hidden',height:'280px'}}>
                  <div style={{height:'32px',background:'#f3f4f6',animation:'pulse 1.5s infinite'}}/>
                  <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
                    <div style={{display:'flex',gap:'12px'}}>
                      <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#f3f4f6'}}/>
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px'}}>
                        <div style={{height:'14px',background:'#f3f4f6',borderRadius:'6px',width:'70%'}}/>
                        <div style={{height:'10px',background:'#f3f4f6',borderRadius:'6px',width:'40%'}}/>
                      </div>
                    </div>
                    <div style={{height:'10px',background:'#f3f4f6',borderRadius:'6px'}}/>
                    <div style={{height:'10px',background:'#f3f4f6',borderRadius:'6px',width:'80%'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:'#9ca3af'}}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>🔍</div>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>No students found</p>
              <p style={{fontSize:'14px'}}>Try different search terms or filters</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'16px'}}>
              {filtered.map(s=><StudentCard key={s.id} {...s}/>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
