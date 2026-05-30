'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Suspense } from 'react'

function ConfirmInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const next = sp.get('next') || '/dashboard'
  const [status, setStatus] = useState('Completing sign in...')

  useEffect(() => {
    async function handleAuth() {
      const sb = createClient()

      // Wait for Supabase to process the hash fragment (#access_token=...)
      let attempts = 0
      const maxAttempts = 10

      const tryGetSession = async () => {
        attempts++
        const { data: { session }, error } = await sb.auth.getSession()

        if (error) {
          setStatus('Sign in failed. Redirecting...')
          setTimeout(() => router.push('/login?error=' + encodeURIComponent(error.message)), 1500)
          return
        }

        if (session?.user) {
          setStatus('Signed in! Loading your profile...')
          const user = session.user

          // Create profile if doesn't exist (new Google user)
          const { data: existing } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle()
          if (!existing) {
            const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'New User'
            const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            const refCode = user.id.replace(/-/g, '').substring(0, 8).toUpperCase()
            await sb.from('profiles').insert({
              id: user.id, email: user.email, full_name: fullName,
              avatar_url: avatarUrl, referral_code: refCode, referral_earnings: 0,
            }).catch(() => {})
            router.push('/dashboard?welcome=true&new=true')
          } else {
            router.push(next + '?welcome=true')
          }
          return
        }

        // No session yet — retry
        if (attempts < maxAttempts) {
          setTimeout(tryGetSession, 400)
        } else {
          setStatus('Sign in timed out. Please try again.')
          setTimeout(() => router.push('/login?error=timeout'), 2000)
        }
      }

      // Small initial delay for hash to be processed
      setTimeout(tryGetSession, 300)
    }

    handleAuth()
  }, [])

  return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px',padding:'20px'}}>
      <div style={{width:'48px',height:'48px',border:'4px solid #fed7aa',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{fontSize:'15px',color:'#374151',fontWeight:'600',textAlign:'center'}}>{status}</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  )
}
