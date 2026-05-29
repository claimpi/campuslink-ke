'use client'
import { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('install-dismissed')) return

    // iOS detection
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    if (ios) {
      // Show iOS instructions after 5 seconds
      setTimeout(() => setShow(true), 5000)
    } else {
      // Android/Desktop - listen for beforeinstallprompt
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShow(true), 3000)
      })
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem('install-dismissed', '1')
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setShow(false)
    }
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', bottom: '72px', left: '12px', right: '12px', zIndex: 200, background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '14px', flexShrink: 0 }}>CL</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>Install CampusLink KE</p>
        {isIOS
          ? <p style={{ fontSize: '11px', color: '#64748b' }}>Tap <strong>Share</strong> then <strong>Add to Home Screen</strong> </p>
          : <p style={{ fontSize: '11px', color: '#64748b' }}>Add to your home screen for quick access </p>
        }
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={install} style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          
        </button>
      </div>
    </div>
  )
}
