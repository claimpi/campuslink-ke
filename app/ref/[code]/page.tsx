'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ReferralPage() {
  const { code } = useParams()
  const router = useRouter()

  useEffect(() => {
    if (code) {
      // Store in both localStorage AND cookie so Google OAuth redirect doesn't lose it
      localStorage.setItem('ref_code', code as string)
      document.cookie = `ref_code=${code};path=/;max-age=86400;SameSite=Lax`
    }
    router.push('/register')
  }, [code])

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh',flexDirection:'column',gap:12}}>
      <div style={{width:36,height:36,border:'3px solid #fed7aa',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'#94a3b8',fontSize:'14px'}}>Setting up your referral...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
