// Design tokens — used consistently across all components
export const c = {
  orange: '#f97316',
  orangeDark: '#ea580c',
  orangeLight: '#fff7ed',
  orangeBorder: '#fed7aa',
  dark: '#0f172a',
  gray: '#64748b',
  grayLight: '#f1f5f9',
  grayBorder: '#e2e8f0',
  white: '#ffffff',
  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  green: '#16a34a',
  greenLight: '#f0fdf4',
  red: '#dc2626',
  redLight: '#fef2f2',
}

export const btn = {
  primary: {background:`linear-gradient(135deg,#f97316,#ea580c)`,color:'#fff',border:'none',borderRadius:'10px',padding:'11px 24px',fontWeight:'600',fontSize:'14px',cursor:'pointer',boxShadow:'0 4px 14px rgba(249,115,22,0.3)',transition:'opacity 0.2s'} as React.CSSProperties,
  secondary: {background:'#fff',color:'#0f172a',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 24px',fontWeight:'600',fontSize:'14px',cursor:'pointer',transition:'border-color 0.2s'} as React.CSSProperties,
  ghost: {background:'transparent',color:'#64748b',border:'none',borderRadius:'8px',padding:'8px 14px',fontWeight:'500',fontSize:'14px',cursor:'pointer'} as React.CSSProperties,
}

export const card = {
  base: {background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'} as React.CSSProperties,
  elevated: {background:'#fff',borderRadius:'16px',border:'1px solid #e2e8f0',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'} as React.CSSProperties,
}

export const inp = {
  base: {width:'100%',border:'1.5px solid #e2e8f0',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',outline:'none',background:'#fff',boxSizing:'border-box',transition:'border-color 0.2s',color:'#0f172a'} as React.CSSProperties,
}

import React from 'react'
