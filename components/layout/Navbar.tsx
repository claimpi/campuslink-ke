'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Compass, MessageCircle, Star, Tag, Shield } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav style={{position:'sticky',top:0,zIndex:50,background:'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',borderBottom:'1px solid #fed7aa',boxShadow:'0 1px 8px rgba(0,0,0,0.06)'}}>
      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'linear-gradient(135deg,#f97316,#ea580c)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'800',fontSize:'13px',boxShadow:'0 4px 12px rgba(249,115,22,0.4)'}}>CL</div>
          <span style={{fontWeight:'800',fontSize:'18px',color:'#111827'}}>CampusLink <span style={{color:'#f97316'}}>KE</span></span>
        </Link>

        <div style={{display:'flex',alignItems:'center',gap:'4px'}} className="desktop-nav">
          {[
            {href:'/discover',label:'Discover',icon:Compass},
            {href:'/groups',label:'Groups',icon:MessageCircle},
            {href:'/discover',label:'Top Students',icon:Star},
            {href:'/pricing',label:'Pricing',icon:Tag},
            {href:'/admin',label:'Admin',icon:Shield},
          ].map(({href,label,icon:Icon})=>(
            <Link key={label} href={href} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 12px',borderRadius:'8px',fontSize:'14px',color:'#4b5563',textDecoration:'none',transition:'all 0.2s'}}
              onMouseEnter={e=>{(e.target as HTMLElement).closest('a')!.style.cssText+='color:#f97316;background:#fff7ed'}}
              onMouseLeave={e=>{(e.target as HTMLElement).closest('a')!.style.cssText+='color:#4b5563;background:transparent'}}>
              <Icon size={15}/>{label}
            </Link>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <Link href="/login" style={{fontSize:'14px',color:'#6b7280',padding:'8px 14px',borderRadius:'8px',textDecoration:'none'}}>Login</Link>
          <Link href="/register" style={{fontSize:'14px',background:'linear-gradient(135deg,#f97316,#ea580c)',color:'white',padding:'9px 20px',borderRadius:'50px',fontWeight:'700',textDecoration:'none',boxShadow:'0 4px 12px rgba(249,115,22,0.35)'}}>Join Free</Link>
        </div>
      </div>
      <style>{`@media(max-width:768px){.desktop-nav{display:none!important}}`}</style>
    </nav>
  )
}
