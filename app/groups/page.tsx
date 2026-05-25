'use client'
import { useState, useEffect } from 'react'
import { Search, Plus, CheckCircle, Users, ExternalLink, X } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'

const MOCK_GROUPS = [
  { id:'1', name:'UoN CS Students 2024', university:'University of Nairobi', category:'Technology', description:'Computer Science students at UoN. Share notes, assignments, and opportunities.', member_count:245, is_verified:true, is_featured:true, whatsapp_link:'https://chat.whatsapp.com/example1' },
  { id:'2', name:'KU Business Network', university:'Kenyatta University', category:'Business', description:'Business students networking and sharing opportunities.', member_count:180, is_verified:true, whatsapp_link:'https://chat.whatsapp.com/example2' },
  { id:'3', name:'Strathmore Law Society', university:'Strathmore University', category:'Law', description:'Law students sharing resources and case studies.', member_count:120, is_verified:false, whatsapp_link:'https://chat.whatsapp.com/example3' },
  { id:'4', name:'JKUAT Engineering Hub', university:'JKUAT', category:'Engineering', description:'Engineers connecting and sharing internship opportunities.', member_count:310, is_verified:true, whatsapp_link:'https://chat.whatsapp.com/example4' },
]

const UNIVERSITIES = ['All Universities','University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Technical University of Kenya','Maseno University']
const CATEGORIES = ['All Categories','Technology','Business','Law','Engineering','Medicine','Education','Arts','Agriculture']

type Group = { id:string; name:string; university:string; category:string; description:string; member_count:number; is_verified:boolean; is_featured?:boolean; whatsapp_link:string }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [university, setUniversity] = useState('All Universities')
  const [category, setCategory] = useState('All Categories')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [newGroup, setNewGroup] = useState({ name:'', whatsapp_link:'', description:'', university:'', category:'Technology', member_count:'0' })
  const set = (k:string) => (e:any) => setNewGroup(g=>({...g,[k]:e.target.value}))

  useEffect(() => { loadGroups() }, [])

  async function loadGroups() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('whatsapp_groups').select('*').order('is_featured',{ascending:false}).order('created_at',{ascending:false})
      if (!error && data && data.length > 0) { setGroups(data) }
      else { setGroups(MOCK_GROUPS) }
    } catch { setGroups(MOCK_GROUPS) }
    setLoading(false)
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroup.name || !newGroup.whatsapp_link || !newGroup.university) { setAddError('Please fill all required fields'); return }
    setSaving(true); setAddError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.from('whatsapp_groups').insert([{
        name: newGroup.name,
        whatsapp_link: newGroup.whatsapp_link,
        description: newGroup.description,
        university: newGroup.university,
        category: newGroup.category,
        member_count: parseInt(newGroup.member_count) || 0,
        is_verified: false,
        is_featured: false,
      }])
      if (error) { setAddError(error.message); setSaving(false); return }
      setShowAdd(false)
      setNewGroup({ name:'', whatsapp_link:'', description:'', university:'', category:'Technology', member_count:'0' })
      loadGroups()
    } catch { setAddError('Something went wrong') }
    setSaving(false)
  }

  const filtered = groups.filter(g => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase())
    const matchUni = university === 'All Universities' || g.university === university
    const matchCat = category === 'All Categories' || g.category === category
    return matchSearch && matchUni && matchCat
  })

  const inp = {width:'100%',border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'11px 14px',fontSize:'14px',outline:'none',boxSizing:'border-box' as const}

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'32px 16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px',flexWrap:'wrap',gap:'12px'}}>
        <div>
          <h1 style={{fontSize:'28px',fontWeight:'900',color:'#111827',display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'28px'}}>💬</span> WhatsApp Groups
          </h1>
          <p style={{color:'#9ca3af',fontSize:'14px',marginTop:'2px'}}>{filtered.length} groups across Kenyan universities</p>
        </div>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:'8px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'11px 20px',borderRadius:'50px',fontWeight:'700',fontSize:'14px',border:'none',cursor:'pointer',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>
          <Plus size={16}/> Add Group
        </button>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'24px',marginTop:'20px'}}>
        <div style={{position:'relative',flex:1,minWidth:'200px'}}>
          <Search size={15} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search groups..."
            style={{width:'100%',paddingLeft:'36px',paddingRight:'12px',paddingTop:'10px',paddingBottom:'10px',border:'1.5px solid #e5e7eb',borderRadius:'12px',fontSize:'14px',outline:'none',boxSizing:'border-box'}}
            onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
        </div>
        <select value={university} onChange={e=>setUniversity(e.target.value)} style={{border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'white',cursor:'pointer'}}>
          {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
        </select>
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{border:'1.5px solid #e5e7eb',borderRadius:'12px',padding:'10px 14px',fontSize:'14px',outline:'none',background:'white',cursor:'pointer'}}>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div style={{textAlign:'center',padding:'60px',color:'#9ca3af'}}>Loading groups...</div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:'center',padding:'60px',color:'#9ca3af'}}>
          <div style={{fontSize:'48px',marginBottom:'12px'}}>💬</div>
          <p style={{fontSize:'16px',fontWeight:'600',color:'#374151',marginBottom:'4px'}}>No groups found</p>
          <p style={{fontSize:'14px'}}>Be the first to add a group!</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
          {filtered.map(g=>(
            <div key={g.id} style={{background:'white',borderRadius:'20px',border:`1px solid ${g.is_featured?'#c4b5fd':'#f3f4f6'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.06)',overflow:'hidden'}}>
              {g.is_featured && <div style={{background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'6px',letterSpacing:'0.5px'}}>✨ FEATURED GROUP</div>}
              <div style={{padding:'20px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                  <h3 style={{fontWeight:'700',color:'#111827',fontSize:'15px',lineHeight:'1.3',flex:1,marginRight:'8px'}}>{g.name}</h3>
                  {g.is_verified && <CheckCircle size={18} style={{color:'#22c55e',flexShrink:0}}/>}
                </div>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
                  <span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'3px 8px',borderRadius:'50px',fontWeight:'600'}}>{g.university?.split(' ').slice(0,2).join(' ')}</span>
                  <span style={{background:'#eff6ff',color:'#2563eb',fontSize:'11px',padding:'3px 8px',borderRadius:'50px',fontWeight:'600'}}>{g.category}</span>
                </div>
                <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'14px',lineHeight:'1.5',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{g.description}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontSize:'12px',color:'#9ca3af',display:'flex',alignItems:'center',gap:'4px'}}><Users size={13}/> {g.member_count} members</span>
                  <a href={g.whatsapp_link} target="_blank" rel="noopener noreferrer"
                    style={{display:'flex',alignItems:'center',gap:'5px',background:'#22c55e',color:'white',padding:'7px 14px',borderRadius:'10px',fontSize:'13px',fontWeight:'700',textDecoration:'none'}}>
                    Join <ExternalLink size={12}/>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      {showAdd && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:'16px'}}>
          <div style={{background:'white',borderRadius:'24px',padding:'28px',width:'100%',maxWidth:'480px',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontSize:'20px',fontWeight:'900',color:'#111827'}}>Add WhatsApp Group</h2>
              <button onClick={()=>setShowAdd(false)} style={{background:'#f3f4f6',border:'none',borderRadius:'8px',padding:'6px',cursor:'pointer'}}><X size={18}/></button>
            </div>
            {addError && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>⚠️ {addError}</div>}
            <form onSubmit={handleAddGroup} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Group Name *</label>
                <input value={newGroup.name} onChange={set('name')} placeholder="e.g. UoN CS Students 2024" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp Invite Link *</label>
                <input value={newGroup.whatsapp_link} onChange={set('whatsapp_link')} placeholder="https://chat.whatsapp.com/..." required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Description</label>
                <textarea value={newGroup.description} onChange={set('description')} placeholder="What is this group about?" rows={3} style={{...inp,resize:'none' as const}} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                  <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University *</label>
                  <select value={newGroup.university} onChange={set('university')} required style={inp}>
                    <option value="">Select...</option>
                    {UNIVERSITIES.slice(1).map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Category</label>
                  <select value={newGroup.category} onChange={set('category')} style={inp}>
                    {CATEGORIES.slice(1).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Member Count</label>
                <input type="number" value={newGroup.member_count} onChange={set('member_count')} placeholder="0" style={inp}/>
              </div>
              <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
                <button type="button" onClick={()=>setShowAdd(false)} style={{flex:1,border:'1.5px solid #e5e7eb',background:'white',color:'#6b7280',padding:'12px',borderRadius:'12px',fontWeight:'600',fontSize:'14px',cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={saving} style={{flex:2,background:saving?'#fdba74':'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'12px',borderRadius:'12px',fontWeight:'700',fontSize:'14px',border:'none',cursor:saving?'not-allowed':'pointer',boxShadow:'0 4px 12px rgba(249,115,22,0.3)'}}>
                  {saving ? '⏳ Saving...' : '✅ Submit Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
