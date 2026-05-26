'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const UNIS=['Africa Nazarene University','Dedan Kimathi University','Egerton University','JKUAT','Kenyatta University','Kisii University','Laikipia University','Maseno University','Meru University','Moi University','Mount Kenya University','Multimedia University','Pwani University','Rongo University','Strathmore University','Technical University of Kenya','University of Nairobi','University of Eldoret','University of Embu','Zetech University','Other']
const COURSES=['Accounting','Architecture','Business Administration','Civil Engineering','Computer Science','Electrical Engineering','Education','Finance','Journalism','Law','Marketing','Mathematics','Medicine','Nursing','Pharmacy','Psychology','Software Engineering']

export default function EditProfile(){
  const router=useRouter()
  const avatarRef=useRef<HTMLInputElement>(null)
  const photosRef=useRef<HTMLInputElement>(null)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [uploadingAvatar,setUploadingAvatar]=useState(false)
  const [uploadingPhotos,setUploadingPhotos]=useState(false)
  const [success,setSuccess]=useState(false)
  const [error,setError]=useState('')
  const [userId,setUserId]=useState('')
  const [userEmail,setUserEmail]=useState('')
  const [avatarUrl,setAvatarUrl]=useState('')
  const [photos,setPhotos]=useState<string[]>([])
  const [form,setForm]=useState({full_name:'',university:'',course:'',year_of_study:'1',whatsapp_number:'',bio:'',interests:'',status:''})
  const set=(k:string)=>(e:any)=>setForm(f=>({...f,[k]:e.target.value}))
  const inp:React.CSSProperties={width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',boxSizing:'border-box',color:'#0f172a'}

  useEffect(()=>{
    const sb=createClient()
    sb.auth.getUser().then(({data:{user}})=>{
      if(!user){router.push('/login');return}
      setUserId(user.id)
      setUserEmail(user.email||'')
      sb.from('profiles').select('*').eq('id',user.id).maybeSingle().then(({data})=>{
        if(data){
          setAvatarUrl(data.avatar_url||'')
          setPhotos(Array.isArray(data.photos)?data.photos:[])
          setForm({full_name:data.full_name||'',university:data.university||'',course:data.course||'',
            year_of_study:String(data.year_of_study||'1'),whatsapp_number:data.whatsapp_number||'',
            bio:data.bio||'',interests:Array.isArray(data.interests)?data.interests.join(', '):(data.interests||''),status:data.status||''})
        }
        setLoading(false)
      })
    })
  },[])

  async function uploadAvatar(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    if(file.size>5*1024*1024){setError('Image must be under 5MB');return}
    setUploadingAvatar(true);setError('')
    const sb=createClient()
    const ext=file.name.split('.').pop()||'jpg'
    const path=`${userId}/avatar.${ext}`
    const {error:upErr}=await sb.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type})
    if(upErr){setError('Upload failed: '+upErr.message);setUploadingAvatar(false);return}
    const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path)
    await sb.from('profiles').update({avatar_url:publicUrl}).eq('id',userId)
    setAvatarUrl(publicUrl)
    setUploadingAvatar(false)
  }

  async function uploadPhotos(e:React.ChangeEvent<HTMLInputElement>){
    const files=Array.from(e.target.files||[])
    if(photos.length+files.length>5){setError('Maximum 5 photos allowed');return}
    setUploadingPhotos(true);setError('')
    const sb=createClient()
    const newUrls:string[]=[]
    for(const file of files){
      if(file.size>5*1024*1024){setError('Each image must be under 5MB');continue}
      const ext=file.name.split('.').pop()||'jpg'
      const path=`${userId}/photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const {error:upErr}=await sb.storage.from('avatars').upload(path,file,{contentType:file.type})
      if(!upErr){
        const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path)
        newUrls.push(publicUrl)
      }
    }
    const updated=[...photos,...newUrls]
    await sb.from('profiles').update({photos:updated}).eq('id',userId)
    setPhotos(updated)
    setUploadingPhotos(false)
  }

  async function removePhoto(url:string){
    const updated=photos.filter(p=>p!==url)
    await createClient().from('profiles').update({photos:updated}).eq('id',userId)
    setPhotos(updated)
  }

  async function handleSave(e:React.FormEvent){
    e.preventDefault();setSaving(true);setError('');setSuccess(false)
    const interests=form.interests.split(',').map(i=>i.trim()).filter(Boolean)
    const {error:err}=await createClient().from('profiles').upsert({
      id:userId,
      email:userEmail, // include email to satisfy NOT NULL constraint
      full_name:form.full_name,university:form.university,course:form.course,
      year_of_study:form.year_of_study,whatsapp_number:form.whatsapp_number,bio:form.bio,status:form.status,interests
    },{onConflict:'id'})
    if(err) setError(err.message)
    else{setSuccess(true);setTimeout(()=>setSuccess(false),3000)}
    setSaving(false)
  }

  function initials(n:string){return(n||'?').split(' ').map((x:string)=>x[0]).join('').toUpperCase().slice(0,2)}

  if(loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',color:'#94a3b8',fontSize:'14px'}}>Loading...</div>

  return(
    <div style={{maxWidth:'640px',margin:'0 auto',padding:'32px 20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'28px'}}>
        <Link href="/dashboard" style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'8px',padding:'8px 14px',fontSize:'13px',color:'#64748b',fontWeight:'600'}}>← Back</Link>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'2px'}}>Edit Profile</h1>
          <p style={{color:'#94a3b8',fontSize:'13px'}}>Changes save to your live profile</p>
        </div>
      </div>

      {success&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'11px 16px',marginBottom:'16px',color:'#16a34a',fontSize:'14px',fontWeight:'600'}}>Profile saved successfully.</div>}
      {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'11px 16px',marginBottom:'16px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}

      {/* Profile Photo */}
      <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',marginBottom:'14px'}}>
        <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'14px'}}>Profile Photo</p>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          {avatarUrl
            ?<img src={avatarUrl} style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'cover',border:'2px solid #e2e8f0',flexShrink:0}}/>
            :<div style={{width:'72px',height:'72px',borderRadius:'50%',background:'#fff7ed',color:'#ea580c',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'22px',border:'2px solid #fed7aa',flexShrink:0}}>{initials(form.full_name)}</div>
          }
          <div>
            <p style={{fontSize:'12px',color:'#94a3b8',marginBottom:'8px'}}>JPG, PNG or WebP · Max 5MB</p>
            <button type="button" onClick={()=>avatarRef.current?.click()} disabled={uploadingAvatar}
              style={{background:uploadingAvatar?'#94a3b8':'#0f172a',color:'#fff',padding:'8px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',border:'none',cursor:uploadingAvatar?'not-allowed':'pointer'}}>
              {uploadingAvatar?'Uploading...':'Upload Photo'}
            </button>
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar} style={{display:'none'}}/>
      </div>

      {/* Gallery Photos */}
      <div style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'20px',marginBottom:'14px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <div>
            <p style={{fontWeight:'700',color:'#0f172a',fontSize:'14px',marginBottom:'2px'}}>Gallery Photos</p>
            <p style={{fontSize:'12px',color:'#94a3b8'}}>{photos.length}/5 photos</p>
          </div>
          {photos.length<5&&(
            <button type="button" onClick={()=>photosRef.current?.click()} disabled={uploadingPhotos}
              style={{background:uploadingPhotos?'#94a3b8':'#f8fafc',border:'1px solid #e2e8f0',color:'#374151',padding:'7px 14px',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:uploadingPhotos?'not-allowed':'pointer'}}>
              {uploadingPhotos?'Uploading...':'+ Add Photos'}
            </button>
          )}
        </div>
        {photos.length>0?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'}}>
            {photos.map((url,i)=>(
              <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:'8px',overflow:'hidden'}}>
                <img src={url} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <button onClick={()=>removePhoto(url)} style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',borderRadius:'50%',width:'20px',height:'20px',fontSize:'12px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:'1'}}>✕</button>
              </div>
            ))}
            {photos.length<5&&[...Array(5-photos.length)].map((_,i)=>(
              <div key={`empty-${i}`} onClick={()=>photosRef.current?.click()} style={{aspectRatio:'1',borderRadius:'8px',border:'2px dashed #e2e8f0',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#cbd5e1',fontSize:'20px'}}>+</div>
            ))}
          </div>
        ):(
          <div onClick={()=>photosRef.current?.click()} style={{border:'2px dashed #e2e8f0',borderRadius:'10px',padding:'28px',textAlign:'center',cursor:'pointer'}}>
            <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'4px'}}>Add up to 5 photos to your profile</p>
            <p style={{fontSize:'12px',color:'#cbd5e1'}}>Click to upload</p>
          </div>
        )}
        <input ref={photosRef} type="file" accept="image/*" multiple onChange={uploadPhotos} style={{display:'none'}}/>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} style={{background:'#fff',borderRadius:'14px',border:'1px solid #e2e8f0',padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Full Name *</label>
          <input value={form.full_name} onChange={set('full_name')} required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>University</label>
            <select value={form.university} onChange={set('university')} style={inp}>
              <option value="">Select...</option>
              {UNIS.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Course</label>
            <select value={form.course} onChange={set('course')} style={inp}>
              <option value="">Select...</option>
              {COURSES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Year</label>
            <select value={form.year_of_study} onChange={set('year_of_study')} style={inp}>
              {['1','2','3','4','5','6'].map(y=><option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>WhatsApp</label>
            <input value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="+254..." style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          </div>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Relationship Status</label>
          <select value={form.status} onChange={set('status')} style={inp}>
            <option value="">Prefer not to say</option>
            <option value="single">💚 Single</option>
            <option value="taken">❤️ Taken</option>
            <option value="complicated">🤔 It's complicated</option>
          </select>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Bio</label>
          <textarea value={form.bio} onChange={set('bio')} rows={3} placeholder="Tell other students about yourself..." style={{...inp,resize:'none'}} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
        <div>
          <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Interests <span style={{fontWeight:'400',color:'#94a3b8'}}>(comma separated)</span></label>
          <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
        <button type="submit" disabled={saving} style={{background:saving?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:saving?'not-allowed':'pointer',marginTop:'4px'}}>
          {saving?'Saving...':'Save Profile'}
        </button>
      </form>
    </div>
  )
}
