import Link from 'next/link'

type Props = {
  id: string; full_name: string; university: string; course: string;
  year_of_study: number; interests?: string[]; avatar_url?: string;
  is_premium?: boolean; is_featured?: boolean; is_top_student?: boolean;
}

function getInitials(name: string) { return name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) }

export default function StudentCard({ id, full_name, university, course, year_of_study, interests=[], is_premium, is_featured, is_top_student }: Props) {
  const bannerBg = is_top_student ? 'linear-gradient(135deg,#f97316,#ea580c)' : is_featured ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : null
  const bannerText = is_top_student ? '⭐ TOP STUDENT' : is_featured ? '✨ FEATURED' : null
  const borderColor = is_featured ? '#c4b5fd' : is_top_student ? '#fed7aa' : '#f3f4f6'
  return (
    <div style={{background:'white',borderRadius:'20px',border:`1px solid ${borderColor}`,boxShadow:'0 4px 20px rgba(0,0,0,0.07)',overflow:'hidden',transition:'all 0.3s'}}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.boxShadow='0 16px 40px rgba(0,0,0,0.12)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.07)'}}>
      {bannerBg && (
        <div style={{background:bannerBg,color:'white',fontSize:'11px',fontWeight:'700',textAlign:'center',padding:'7px',letterSpacing:'0.5px'}}>{bannerText}</div>
      )}
      <div style={{padding:'20px'}}>
        <div style={{display:'flex',gap:'14px',alignItems:'flex-start',marginBottom:'14px'}}>
          <div style={{width:'52px',height:'52px',borderRadius:'50%',background:is_premium?'#ede9fe':'#fff7ed',color:is_premium?'#7c3aed':'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'16px',flexShrink:0,border:is_premium?'2px solid #c4b5fd':'2px solid #fed7aa'}}>
            {getInitials(full_name)}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:'700',color:'#111827',fontSize:'15px',lineHeight:'1.3',marginBottom:'6px'}}>{full_name}</div>
            <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
              <span style={{background:'#fff7ed',color:'#ea580c',fontSize:'11px',padding:'2px 8px',borderRadius:'50px',fontWeight:'600',whiteSpace:'nowrap'}}>Year {year_of_study}</span>
              {is_premium && <span style={{background:'#faf5ff',color:'#7c3aed',fontSize:'11px',padding:'2px 8px',borderRadius:'50px',fontWeight:'600'}}>👑 Premium</span>}
            </div>
          </div>
        </div>
        <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📚 {course}</div>
        <div style={{fontSize:'13px',color:'#9ca3af',marginBottom:'14px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>📍 {university}</div>
        {interests.length > 0 && (
          <div style={{display:'flex',gap:'5px',flexWrap:'wrap',marginBottom:'14px'}}>
            {interests.slice(0,3).map(i=>(
              <span key={i} style={{background:'#f9fafb',color:'#6b7280',fontSize:'11px',padding:'3px 8px',borderRadius:'50px',border:'1px solid #e5e7eb'}}>{i}</span>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:'8px'}}>
          <Link href={`/profile/${id}`} style={{flex:1,textAlign:'center',border:'1.5px solid #e5e7eb',color:'#374151',padding:'9px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',textDecoration:'none',transition:'all 0.2s'}}>View</Link>
          <a href="https://wa.me/254790166252" target="_blank" rel="noopener noreferrer" style={{flex:1,textAlign:'center',background:'#22c55e',color:'white',padding:'9px',borderRadius:'10px',fontSize:'13px',fontWeight:'600',textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px'}}>
            💬 Chat
          </a>
        </div>
      </div>
    </div>
  )
}
