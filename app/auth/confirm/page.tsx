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

      // Give Supabase a moment to process the hash token
      await new Promise(r => setTimeout(r, 500))

      const { data: { session }, error } = await sb.auth.getSession()

      if (error) {
        setStatus('Sign in failed: ' + error.message)
        setTimeout(() => router.push('/login?error=' + encodeURIComponent(error.message)), 2000)
        return
      }

      if (session?.user) {
        // Ensure profile exists for OAuth users
        const user = session.user
        const { data: existing } = await sb.from('profiles').select('id').eq('id', user.id).maybeSingle()

        if (!existing) {
          const fullName = user.user_metadata?.full_name
            || user.user_metadata?.name
            || user.email?.split('@')[0]
            || 'New User'
          const avatarUrl = user.user_metadata?.avatar_url
            || user.user_metadata?.picture
            || null
          const refCode = user.id.replace(/-/g, '').substring(0, 8).toUpperCase()

          await sb.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            avatar_url: avatarUrl,
            referral_code: refCode,
            referral_earnings: 0,
          })
          router.push('/dashboard?welcome=true&new=true')
        } else {
          router.push(next + '?welcome=true')
        }
      } else {
        // No session yet — try waiting a bit more for hash to be processed
        setTimeout(async () => {
          const { data: { session: s2 } } = await sb.auth.getSession()
          if (s2) {
            router.push(next + '?welcome=true')
          } else {
            setStatus('Sign in failed. Please try again.')
            setTimeout(() => router.push('/login?error=session_not_found'), 2000)
          }
        }, 1500)
      }
    }

    handleAuth()
  }, [])

  return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'16px'}}>
      <div style={{width:'44px',height:'44px',border:'4px solid #fed7aa',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{fontSize:'15px',color:'#374151',fontWeight:'600'}}>{status}</p>
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
