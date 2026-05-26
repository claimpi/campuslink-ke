'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ReferralPage() {
  const { code } = useParams()
  const router = useRouter()

  useEffect(() => {
    // Store referral code in localStorage then redirect to register
    if (code) {
      localStorage.setItem('ref_code', code as string)
    }
    router.push('/register')
  }, [code])

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'80vh'}}>
      <p style={{color:'#94a3b8',fontSize:'14px'}}>Redirecting...</p>
    </div>
  )
}
