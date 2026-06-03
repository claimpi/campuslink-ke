'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
export default function Page() {
  const router = useRouter()
  useEffect(() => { createClient().auth.getUser().then(({data:{user}}:any) => { if(!user) router.replace('/') }) }, [])
  return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'#94a3b8'}}><div style={{fontSize:40}}>🚧</div><p>Coming soon</p><button onClick={()=>router.back()} style={{color:'#f97316',fontWeight:700,background:'none',border:'none',cursor:'pointer',fontSize:14}}>← Go back</button></div>
}
