'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext<{dark:boolean,toggle:()=>void}>({dark:false,toggle:()=>{}})
export const useTheme = () => useContext(ThemeCtx)

export default function ThemeProvider({children}:{children:React.ReactNode}){
  const [dark,setDark]=useState(false)
  const [mounted,setMounted]=useState(false)

  useEffect(()=>{
    setMounted(true)
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved ? saved==='dark' : prefersDark
    setDark(isDark)
    document.documentElement.setAttribute('data-theme', isDark?'dark':'light')
  },[])

  function toggle(){
    const next = !dark
    setDark(next)
    localStorage.setItem('theme', next?'dark':'light')
    document.documentElement.setAttribute('data-theme', next?'dark':'light')
  }

  if(!mounted) return <>{children}</>
  return <ThemeCtx.Provider value={{dark,toggle}}>{children}</ThemeCtx.Provider>
}
