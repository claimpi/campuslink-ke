'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // iOS Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    if (ios && !(navigator as any).standalone) {
      setIsIOS(true)
      const dismissed = localStorage.getItem('install_dismissed')
      if (!dismissed) setTimeout(() => setShow(true), 3000)
      return
    }

    // Android Chrome — intercept beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault()
      setPrompt(e)
      const dismissed = localStorage.getItem('install_dismissed')
      if (!dismissed) setTimeout(() => setShow(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setShow(false)
    }
  }

  function dismiss() {
    setShow(false)
    localStorage.setItem('install_dismissed', '1')
  }

  if (!show || isInstalled) return null

  return (
    <div style={{ position: 'fixed', bottom: 70, left: 0, right: 0, zIndex: 9000, padding: '0 12px' }}>
      <div style={{ background: '#0f172a', borderRadius: 16, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 480, margin: '0 auto' }}>
        <img src="/icon-192.png" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} alt="CampusLink" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 13, margin: 0 }}>Install CampusLink KE</p>
          {isIOS
            ? <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '2px 0 0' }}>Tap Share → Add to Home Screen</p>
            : <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '2px 0 0' }}>Add to home screen for the best experience</p>
          }
        </div>
        {!isIOS && (
          <button onClick={install} style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', flexShrink: 0, fontSize: 14 }}>✕</button>
      </div>
    </div>
  )
}
