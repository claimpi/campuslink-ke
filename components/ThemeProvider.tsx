'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const ThemeCtx = createContext<{dark:boolean,toggle:()=>void}>({dark:false,toggle:()=>{}})
export const useTheme = () => useContext(ThemeCtx)

export default function ThemeProvider({children}:{children:React.ReactNode}){
  const [dark,setDark]=useState(false)

  useEffect(()=>{
    const saved=localStorage.getItem('theme')
    if(saved==='dark') setDark(true)
  },[])

  useEffect(()=>{
    localStorage.setItem('theme', dark?'dark':'light')
    document.documentElement.setAttribute('data-theme', dark?'dark':'light')
  },[dark])

  return(
    <ThemeCtx.Provider value={{dark,toggle:()=>setDark(d=>!d)}}>
      {children}
    </ThemeCtx.Provider>
  )
}
