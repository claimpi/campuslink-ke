'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const INTERESTS = ['Music','Travel','Food','Fitness','Movies','Reading','Gaming','Art','Fashion','Football','Dancing','Photography','Cooking','Tech','Nature']

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [f, setF] = useState({ name:'', email:'', password:'', age:'', gender:'', want:'', bio:'', interests:[] as string[] })
  const [photos, setPhotos] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const up = (k:string) => (v:string) => setF(x=>({...x,[k]:v}))

  const progress = step / 4 * 100

  async function step1(e:any) {
    e.preventDefault(); setErr(''); setLoading(true)
    if (!f.name.trim()||!f.email.trim()||f.password.length<6){setErr('Fill all fields. Password min 6 chars.');setLoading(false);return}
    const {error} = await createClient().auth.signUp({email:f.email,password:f.password,options:{data:{full_name:f.name}}})
    if(error){setErr(error.message);setLoading(false);return}
    setLoading(false); setStep(2)
  }

  async function step2(e:any) {
    e.preventDefault(); setErr('')
    if(!f.age||!f.gender||!f.want){setErr('Fill all fields');return}
    setStep(3)
  }

  async function uploadPhoto(file:File) {
    if(photos.length>=6){setErr('Max 6 photos');return}
    setUploading(true)
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    if(!user){setUploading(false);return}
    const path = `avatars/${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const {error} = await sb.storage.from('avatars').upload(path,file,{upsert:true})
    if(error){setErr('Upload failed');setUploading(false);return}
    const {data:{publicUrl}} = sb.storage.from('avatars').getPublicUrl(path)
    setPhotos(p=>[...p,publicUrl])
    setUploading(false)
  }

  async function finish() {
    if(photos.length<1){setErr('Add at least 1 photo');return}
    setLoading(true); setErr('')
    const sb = createClient()
    const {data:{user}} = await sb.auth.getUser()
    if(!user){router.push('/login');return}
    const code = user.id.replace(/-/g,'').slice(0,8).toUpperCase()
    await sb.from('profiles').upsert({
      id:user.id, email:user.email, full_name:f.name,
      avatar_url:photos[0], photos:photos.slice(1),
      age:parseInt(f.age), gender:f.gender, looking_for:f.want,
      bio:f.bio, interests:f.interests, referral_code:code, coins:10
    },{onConflict:'id'})
    // Handle referral
    const ref = localStorage.getItem('ref_code')
    if(ref){
      const {data:referrer} = await sb.from('profiles').select('id,coins').eq('referral_code',ref.toUpperCase()).maybeSingle()
      if(referrer&&referrer.id!==user.id){
        await sb.from('profiles').update({coins:(referrer.coins||0)+50}).eq('id',referrer.id)
        await sb.from('profiles').update({referred_by:referrer.id}).eq('id',user.id)
        try{await sb.from('referrals').insert([{referrer_id:referrer.id,referred_id:user.id,amount:50,status:'credited'}])}catch{}
        localStorage.removeItem('ref_code')
      }
    }
    router.replace('/home?new=true')
  }

  const tog = (i:string) => setF(x=>({...x,interests:x.interests.includes(i)?x.interests.filter(v=>v!==i):x.interests.length<5?[...x.interests,i]:x.interests}))

  return (
    <div style={{minHeight:'100dvh',background:'#fff',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{padding:'16px 20px 0',display:'flex',alignItems:'center',gap:12}}>
        {step>1&&<button onClick={()=>setStep(s=>s-1)} style={{width:36,height:36,borderRadius:'50%',border:'1px solid #e8e8e8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#374151'}}>←</button>}
        <div style={{flex:1,height:4,background:'#f1f5f9',borderRadius:2,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#f97316,#ec4899)',width:`${progress}%`,transition:'width 0.4s'}}/>
        </div>
        <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,flexShrink:0}}>{step} / 4</span>
      </div>

      <div style={{flex:1,padding:'24px 24px 40px',overflowY:'auto'}}>

        {/* STEP 1 */}
        {step===1&&(
          <form onSubmit={step1} className="fu" style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{marginBottom:8}}>
              <h1 style={{fontSize:26,fontWeight:900,color:'#111',marginBottom:4}}>Create Account 👋</h1>
              <p style={{color:'#94a3b8',fontSize:14}}>Join free and start connecting</p>
            </div>
            <FInput label="Full Name" type="text" value={f.name} onChange={up('name')} placeholder="e.g. Emily Wanjiru" />
            <FInput label="Email Address" type="email" value={f.email} onChange={up('email')} placeholder="you@gmail.com" />
            <FInput label="Password" type="password" value={f.password} onChange={up('password')} placeholder="Minimum 6 characters" />
            {err&&<ErrMsg>{err}</ErrMsg>}
            <BigBtn loading={loading}>Continue →</BigBtn>
            <p style={{textAlign:'center',color:'#94a3b8',fontSize:13}}>Already have an account? <span onClick={()=>router.push('/login')} style={{color:'#f97316',fontWeight:700,cursor:'pointer'}}>Sign In</span></p>
          </form>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <form onSubmit={step2} className="fu" style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{marginBottom:4}}>
              <h1 style={{fontSize:26,fontWeight:900,color:'#111',marginBottom:4}}>About You 🙋</h1>
              <p style={{color:'#94a3b8',fontSize:14}}>Help us find your perfect match</p>
            </div>
            <FInput label="Your Age" type="number" value={f.age} onChange={up('age')} placeholder="e.g. 22" min="16" max="60" />
            <div>
              <Label>I am a</Label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
                {[['male','👨 Man'],['female','👩 Woman']].map(([v,l])=>(
                  <ChoiceBtn key={v} active={f.gender===v} onClick={()=>up('gender')(v)} color="#f97316">{l}</ChoiceBtn>
                ))}
              </div>
            </div>
            <div>
              <Label>I'm looking for</Label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:8}}>
                {[['relationship','💕 Dating'],['friendship','🤝 Friends'],['casual','😊 Casual'],['networking','🌐 Network']].map(([v,l])=>(
                  <ChoiceBtn key={v} active={f.want===v} onClick={()=>up('want')(v)} color="#ec4899">{l}</ChoiceBtn>
                ))}
              </div>
            </div>
            {err&&<ErrMsg>{err}</ErrMsg>}
            <BigBtn>Continue →</BigBtn>
          </form>
        )}

        {/* STEP 3 — Photos */}
        {step===3&&(
          <div className="fu" style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{marginBottom:4}}>
              <h1 style={{fontSize:26,fontWeight:900,color:'#111',marginBottom:4}}>Add Photos 📸</h1>
              <p style={{color:'#94a3b8',fontSize:14}}>Profiles with photos get 10× more matches. Add up to 6.</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[...Array(6)].map((_,i)=>{
                const photo=photos[i]
                return (
                  <div key={i} onClick={()=>!photo&&fileRef.current?.click()}
                    style={{aspectRatio:'3/4',borderRadius:14,overflow:'hidden',border:`2px ${photo?'solid #f97316':'dashed #ddd'}`,background:'#f9f9f9',position:'relative',cursor:photo?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {photo
                      ?<>
                        <img src={photo} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                        <button onClick={e=>{e.stopPropagation();setPhotos(p=>p.filter((_,j)=>j!==i))}}
                          style={{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:'50%',background:'rgba(0,0,0,0.55)',color:'#fff',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                        {i===0&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(249,115,22,0.85)',color:'#fff',fontSize:9,fontWeight:800,textAlign:'center',padding:'3px 0',letterSpacing:'0.5px'}}>MAIN PHOTO</div>}
                      </>
                      :<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,color:'#ccc'}}>
                        {uploading&&i===photos.length
                          ?<div className="spin" style={{width:20,height:20,border:'2px solid #f97316',borderTopColor:'transparent',borderRadius:'50%'}}/>
                          :<span style={{fontSize:28}}>+</span>
                        }
                      </div>
                    }
                  </div>
                )
              })}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)uploadPhoto(f);e.target.value=''}}/>
            {err&&<ErrMsg>{err}</ErrMsg>}
            <BigBtn onClick={()=>{if(photos.length===0){setErr('Add at least 1 photo');return}setStep(4)}} type="button" loading={uploading}>
              {photos.length===0?'Add a Photo First':`Continue with ${photos.length} photo${photos.length>1?'s':''} →`}
            </BigBtn>
          </div>
        )}

        {/* STEP 4 — Bio + Interests */}
        {step===4&&(
          <div className="fu" style={{display:'flex',flexDirection:'column',gap:20}}>
            <div style={{marginBottom:4}}>
              <h1 style={{fontSize:26,fontWeight:900,color:'#111',marginBottom:4}}>Final Touch ✨</h1>
              <p style={{color:'#94a3b8',fontSize:14}}>Tell people what makes you unique</p>
            </div>
            <div>
              <Label>Bio <span style={{fontWeight:400,color:'#ccc'}}>(optional)</span></Label>
              <textarea value={f.bio} onChange={e=>up('bio')(e.target.value)} placeholder="Say something about yourself..." rows={3}
                style={{width:'100%',border:'1.5px solid #e8e8e8',borderRadius:14,padding:'12px 14px',fontSize:14,outline:'none',resize:'none',fontFamily:'inherit',lineHeight:1.6,marginTop:8}}
                onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e8e8e8'}/>
            </div>
            <div>
              <Label>Interests <span style={{fontWeight:400,color:'#94a3b8',fontSize:12}}>— pick up to 5 ({f.interests.length}/5)</span></Label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
                {INTERESTS.map(i=>(
                  <button key={i} type="button" onClick={()=>tog(i)}
                    style={{padding:'8px 14px',borderRadius:50,border:`1.5px solid ${f.interests.includes(i)?'#f97316':'#e8e8e8'}`,background:f.interests.includes(i)?'#fff7ed':'#fff',color:f.interests.includes(i)?'#f97316':'#555',fontSize:13,fontWeight:600,transition:'all 0.2s'}}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            {err&&<ErrMsg>{err}</ErrMsg>}
            <BigBtn onClick={finish} type="button" loading={loading}>🎉 Start Matching!</BigBtn>
          </div>
        )}
      </div>
    </div>
  )
}

function FInput({label,...props}:any){
  const [focused,setFocused]=useState(false)
  return(
    <div>
      <label style={{fontSize:13,fontWeight:700,color:'#374151',display:'block',marginBottom:6}}>{label}</label>
      <input {...props} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
        style={{width:'100%',border:`1.5px solid ${focused?'#f97316':'#e8e8e8'}`,borderRadius:14,padding:'13px 16px',fontSize:15,outline:'none',transition:'border 0.2s',background:'#fff'}}/>
    </div>
  )
}
function Label({children}:any){return <label style={{fontSize:13,fontWeight:700,color:'#374151',display:'block'}}>{children}</label>}
function ErrMsg({children}:any){return <p style={{color:'#ef4444',fontSize:13,background:'#fef2f2',padding:'10px 14px',borderRadius:10}}>{children}</p>}
function ChoiceBtn({children,active,onClick,color}:any){
  return(
    <button type="button" onClick={onClick}
      style={{padding:'13px',borderRadius:14,border:`2px solid ${active?color:'#e8e8e8'}`,background:active?`${color}14`:'#fff',color:active?color:'#555',fontSize:14,fontWeight:700,transition:'all 0.2s'}}>
      {children}
    </button>
  )
}
function BigBtn({children,loading,onClick,type='submit'}:any){
  return(
    <button type={type} onClick={onClick} disabled={loading}
      style={{width:'100%',padding:'16px',borderRadius:50,background:loading?'#f1f5f9':'linear-gradient(135deg,#f97316,#ea580c)',color:loading?'#aaa':'#fff',fontSize:16,fontWeight:900,letterSpacing:'-0.3px',boxShadow:loading?'none':'0 4px 20px rgba(249,115,22,0.3)',transition:'all 0.2s',border:'none'}}>
      {loading?<span className="spin" style={{display:'inline-block',width:20,height:20,border:'2px solid #ccc',borderTopColor:'#888',borderRadius:'50%',verticalAlign:'middle'}}/>:children}
    </button>
  )
}
