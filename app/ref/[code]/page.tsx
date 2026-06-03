'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function RefPage() {
  const { code } = useParams()
  const router = useRouter()
  useEffect(() => {
    if (code) {
      localStorage.setItem('ref_code', code as string)
      document.cookie = `ref_code=${code};path=/;max-age=604800`
    }
    router.replace('/register')
  }, [code])
  return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>💕</div>
}
