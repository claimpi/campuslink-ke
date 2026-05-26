'use client'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'
export interface ToastMsg { id: string; message: string; type: ToastType; icon?: string }

let addToast: (msg: Omit<ToastMsg, 'id'>) => void = () => {}

export function toast(message: string, type: ToastType = 'info', icon?: string) {
  addToast({ message, type, icon })
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  useEffect(() => {
    addToast = (msg) => {
      const id = Math.random().toString(36).slice(2)
      setToasts(t => [{ ...msg, id }, ...t].slice(0, 5))
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
    }
  }, [])

  const colors: Record<ToastType, { bg: string; border: string; color: string }> = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb' },
    warning: { bg: '#fefce8', border: '#fde68a', color: '#ca8a04' },
    error:   { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
  }

  return (
    <div style={{ position: 'fixed', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', width: '90%', maxWidth: '400px', pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: colors[t.type].bg,
          border: `1px solid ${colors[t.type].border}`,
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          animation: 'slideDown 0.3s ease',
          pointerEvents: 'auto',
        }}>
          {t.icon && <span style={{ fontSize: '18px', flexShrink: 0 }}>{t.icon}</span>}
          <p style={{ fontSize: '13px', fontWeight: '600', color: colors[t.type].color, flex: 1 }}>{t.message}</p>
        </div>
      ))}
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
