'use client'
import { useRef, useState } from 'react'

interface SwipeCardProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  children: React.ReactNode
}

export default function SwipeCard({ onSwipeLeft, onSwipeRight, children }: SwipeCardProps) {
  const startX = useRef(0)
  const startY = useRef(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const THRESHOLD = 80

  function onStart(x: number, y: number) {
    startX.current = x
    startY.current = y
    setDragging(true)
  }

  function onMove(x: number) {
    if (!dragging) return
    setDragX(x - startX.current)
  }

  function onEnd() {
    if (!dragging) return
    setDragging(false)
    if (dragX > THRESHOLD) {
      onSwipeRight?.()
    } else if (dragX < -THRESHOLD) {
      onSwipeLeft?.()
    }
    setDragX(0)
  }

  const rotate = dragX * 0.05
  const opacity = Math.max(0, 1 - Math.abs(dragX) / 300)

  return (
    <div
      onMouseDown={e => onStart(e.clientX, e.clientY)}
      onMouseMove={e => onMove(e.clientX)}
      onMouseUp={onEnd}
      onMouseLeave={onEnd}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX) }}
      onTouchEnd={onEnd}
      style={{
        transform: dragging ? `translateX(${dragX}px) rotate(${rotate}deg)` : 'none',
        transition: dragging ? 'none' : 'transform 0.3s ease',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* Like indicator */}
      {dragX > 30 && (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, background: '#16a34a', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 800, fontSize: 18, border: '2.5px solid #16a34a', opacity: Math.min(1, dragX / THRESHOLD) }}>
          ❤️ LIKE
        </div>
      )}
      {/* Pass indicator */}
      {dragX < -30 && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: '#ef4444', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 800, fontSize: 18, border: '2.5px solid #ef4444', opacity: Math.min(1, -dragX / THRESHOLD) }}>
          PASS ✕
        </div>
      )}
      {children}
    </div>
  )
}
