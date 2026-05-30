'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{file:File, preview:string}[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [refCode, setRefCode] = useState('')
  const [registeredUserId, setRegisteredUserId] = useState('')
  const [form, setForm] = useState({name:'',email:'',password:'',confirmPassword:'',interests:'',bio:'',age:'',gender:'',looking_for:''})
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))
  const inp:React.CSSProperties = {width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',boxSizing:'border-box',color:'#0f172a'}

  useEffect(() => {
    const stored = localStorage.getItem('ref_code')
    if (stored) setRefCode(stored)
  }, [])

  async function handleGoogleSignUp() {
    setGoogleLoading(true)
    setError('')
    const sb = createClient()
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      }
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { setError('Please fill all fields'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(''); setStep(2)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const sb = createClient()
    try {
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.name }, emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (!authData.user) { setError('Registration failed.'); setLoading(false); return }

      const interests = form.interests.split(',').map(i=>i.trim()).filter(Boolean)
      const newRefCode = authData.user.id.replace(/-/g,'').substring(0,8).toUpperCase()

      await sb.from('profiles').upsert({
        id: authData.user.id,
        email: form.email.trim(),
        full_name: form.name,
        
        bio: form.bio,
        interests,
        referral_code: newRefCode,
        referral_earnings: 0,
      }, { onConflict: 'id' })

      if (refCode) {
        const { data: referrer } = await sb.from('profiles')
          .select('id').eq('referral_code', refCode.toUpperCase()).maybeSingle()
        if (referrer) {
          await sb.from('profiles').update({ referred_by: referrer.id }).eq('id', authData.user.id)
        }
      }

      localStorage.removeItem('ref_code')
      setRegisteredUserId(authData.user.id)
      setLoading(false)
      setStep(3)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'85vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'24px',background:'#f8fafc'}}>
      <div style={{width:'100%',maxWidth:'500px',background:'#fff',borderRadius:'20px',boxShadow:'0 4px 24px rgba(0,0,0,0.08)',padding:'36px',border:'1px solid #e2e8f0'}}>
        <div style={{textAlign:'center',marginBottom:'24px'}}>
          <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'900',fontSize:'16px',margin:'0 auto 12px'}}>CL</div>
          <h1 style={{fontSize:'22px',fontWeight:'800',color:'#0f172a',marginBottom:'4px'}}>Create Account</h1>
          <p style={{color:'#94a3b8',fontSize:'13px'}}>Join CampusLink KE — free forever</p>
          {refCode&&<div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'7px 12px',marginTop:'10px',fontSize:'12px',color:'#16a34a',fontWeight:'600'}}>Referral code applied: {refCode}</div>}
        </div>

        {/* Progress bar — only show on email steps */}
        {step < 3 && (
          <div style={{display:'flex',gap:'6px',marginBottom:'20px'}}>
            {[1,2,3].map(n=><div key={n} style={{flex:1,height:'3px',borderRadius:'2px',background:step>=n?'linear-gradient(135deg,#f97316,#ea580c)':'#f1f5f9',transition:'all 0.3s'}}/>)}
          </div>
        )}

        {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}

        {step===1&&(
          <>
            {/* Google Sign Up */}
            <button onClick={handleGoogleSignUp} disabled={googleLoading}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',padding:'12px',border:'1.5px solid #e2e8f0',borderRadius:'10px',background:'#fff',cursor:googleLoading?'not-allowed':'pointer',fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'16px',transition:'all 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              {googleLoading ? (
                <div style={{width:'18px',height:'18px',border:'2px solid #e2e8f0',borderTop:'2px solid #4285f4',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px'}}>
              <div style={{flex:1,height:'1px',background:'#e2e8f0'}}/>
              <span style={{fontSize:'12px',color:'#94a3b8',fontWeight:'500'}}>or sign up with email</span>
              <div style={{flex:1,height:'1px',background:'#e2e8f0'}}/>
            </div>

            <form onSubmit={nextStep} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Full Name *</label>
                <input value={form.name} onChange={set('name')} placeholder="John Kamau" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Email *</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Password *</label>
                <input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <div>
                <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
              </div>
              <button type="submit" style={{background:'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',border:'none',cursor:'pointer',marginTop:'4px'}}>Continue →</button>
            </form>
          </>
        )}

        {step===2&&(
          <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:'13px'}}>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Age</label>
              <input type="number" value={form.age||''} onChange={set('age')} placeholder="e.g. 21" min="16" max="60" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Gender</label>
              <select value={form.gender||''} onChange={set('gender')} style={inp}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Looking For</label>
              <select value={form.looking_for||''} onChange={set('looking_for')} style={inp}>
                <option value="">Not specified</option>
                <option value="friendship">Friendship</option>
                <option value="relationship">Relationship</option>
                <option value="study">Study Partner</option>
                <option value="networking">Networking</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Bio <span style={{fontWeight:'400',color:'#94a3b8'}}>(optional)</span></label>
              <textarea value={form.bio} onChange={set('bio')} rows={2} placeholder="Tell others about yourself..." style={{...inp,resize:'none'}}/>
            </div>
            <div>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}}>Interests <span style={{fontWeight:'400',color:'#94a3b8'}}>(comma separated)</span></label>
              <input value={form.interests} onChange={set('interests')} placeholder="football, coding, music" style={inp} onFocus={e=>e.target.style.borderColor='#f97316'} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button type="button" onClick={()=>{setStep(1);setError('')}} style={{flex:1,border:'1.5px solid #e2e8f0',background:'#fff',color:'#64748b',padding:'12px',borderRadius:'10px',fontWeight:'600',fontSize:'14px',cursor:'pointer'}}>Back</button>
              <button type="submit" disabled={loading} style={{flex:2,background:loading?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',color:'#fff',padding:'12px',borderRadius:'10px',fontWeight:'700',fontSize:'14px',border:'none',cursor:loading?'not-allowed':'pointer'}}>
                {loading?'Creating account...':'Continue to Photo'}
              </button>
            </div>
          </form>
        )}

        {step===3&&(
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'15px',color:'#374151',fontWeight:'700',marginBottom:'4px'}}>Add your photos</p>
              <p style={{fontSize:'13px',color:'#94a3b8',marginBottom:'4px'}}>Minimum <strong>2 photos</strong> required · First photo is your profile picture</p>
              <p style={{fontSize:'12px',color:photos.length>=2?'#16a34a':'#f97316',fontWeight:'600'}}>{photos.length}/5 photos added {photos.length>=2?'✓':''}</p>
            </div>

            {/* Photo grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
              {/* Existing photos */}
              {photos.map((p,i)=>(
                <div key={i} style={{position:'relative',aspectRatio:'1',borderRadius:'12px',overflow:'hidden',
                  border:i===0?'2.5px solid #f97316':'1.5px solid #e2e8f0'}}>
                  <img src={p.preview} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                  {i===0&&<div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(249,115,22,0.85)',color:'#fff',fontSize:'9px',fontWeight:'700',textAlign:'center',padding:'3px'}}>MAIN</div>}
                  <button onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))}
                    style={{position:'absolute',top:4,right:4,width:'20px',height:'20px',borderRadius:'50%',background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',cursor:'pointer',fontSize:'11px',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                </div>
              ))}

              {/* Add more slot */}
              {photos.length<5&&(
                <label style={{aspectRatio:'1',borderRadius:'12px',border:'2px dashed #f97316',cursor:'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                  background:'#fff7ed',gap:'4px'}}>
                  <span style={{fontSize:'24px',color:'#f97316'}}>+</span>
                  <span style={{fontSize:'10px',color:'#f97316',fontWeight:'600'}}>Add Photo</span>
                  <input type="file" accept="image/*" multiple style={{display:'none'}}
                    onChange={e=>{
                      const files=Array.from(e.target.files||[])
                      const remaining=5-photos.length
                      const toAdd=files.slice(0,remaining)
                      const invalid=toAdd.find(f=>f.size>5*1024*1024)
                      if(invalid){setError('Each photo must be under 5MB');return}
                      setError('')
                      setPhotos(prev=>[...prev,...toAdd.map(f=>({file:f,preview:URL.createObjectURL(f)}))])
                      e.target.value=''
                    }}/>
                </label>
              )}
            </div>

            {/* Min 2 photos warning */}
            {photos.length===1&&(
              <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#92400e',display:'flex',gap:'8px',alignItems:'center'}}>
                <span>⚠️</span> Add at least <strong>1 more photo</strong> to continue
              </div>
            )}
            {photos.length===0&&(
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#dc2626',display:'flex',gap:'8px',alignItems:'center'}}>
                <span>📸</span> You need at least <strong>2 photos</strong> to create your profile
              </div>
            )}

            {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',padding:'10px',color:'#dc2626',fontSize:'13px'}}>{error}</div>}

            <button onClick={async()=>{
              if(photos.length<2){setError('Please add at least 2 photos to continue');return}
              setUploadingPhoto(true);setError('')
              try{
                const sb=createClient()
                const uid=registeredUserId
                if(!uid){setError('Session expired, please register again');setUploadingPhoto(false);return}

                const uploadedUrls:string[]=[]
                for(let i=0;i<photos.length;i++){
                  const p=photos[i]
                  const ext=p.file.name.split('.').pop()
                  const path=`${uid}/photo_${i}.${ext}`
                  const {error:upErr}=await sb.storage.from('avatars').upload(path,p.file,{upsert:true})
                  if(upErr){setError('Upload failed: '+upErr.message);setUploadingPhoto(false);return}
                  const {data:{publicUrl}}=sb.storage.from('avatars').getPublicUrl(path)
                  uploadedUrls.push(publicUrl)
                }

                // First photo = avatar, all photos saved to photos array
                await sb.from('profiles').update({
                  avatar_url:uploadedUrls[0],
                  photos:uploadedUrls
                }).eq('id',uid)

                window.location.href='/dashboard?welcome=true'
              }catch(e:any){setError(e.message);setUploadingPhoto(false)}
            }} disabled={uploadingPhoto||photos.length<2}
              style={{background:photos.length<2||uploadingPhoto?'#94a3b8':'linear-gradient(135deg,#f97316,#ea580c)',
                color:'#fff',padding:'13px',borderRadius:'10px',fontWeight:'700',fontSize:'15px',
                border:'none',cursor:photos.length<2||uploadingPhoto?'not-allowed':'pointer',
                boxShadow:photos.length>=2?'0 4px 14px rgba(249,115,22,0.4)':'none'}}>
              {uploadingPhoto?`Uploading ${photos.length} photos...`:`Complete Sign Up (${photos.length}/2 min)`}
            </button>
            <p style={{textAlign:'center',fontSize:'12px',color:'#94a3b8'}}>More photos = more connections 📸</p>
          </div>
        )}

        <p style={{textAlign:'center',fontSize:'13px',color:'#94a3b8',marginTop:'18px'}}>
          Already have an account? <Link href="/login" style={{color:'#f97316',fontWeight:'700'}}>Sign In</Link>
        </p>
      </div>
    </div>
  )
}
