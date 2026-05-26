'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

const VAPID_PUBLIC = 'BGr7I7aIKp2F9EKriGKmbO9lcizUl3cWWa1meCKD9_clk5zulm4eXOolpUQRyywOcW60n7nW4BSLaoT1rAKyiok'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export default function PushNotifications() {
  useEffect(() => {
    async function setup() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      // Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Check if already subscribed
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Save to DB in case not saved yet
        await saveSub(sb, user.id, existing)
        return
      }

      // Ask permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      // Subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      })

      await saveSub(sb, user.id, sub)
    }

    async function saveSub(sb: any, userId: string, sub: PushSubscription) {
      const subJson = sub.toJSON()
      await sb.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: (subJson.keys as any)?.p256dh,
        auth: (subJson.keys as any)?.auth,
      }, { onConflict: 'user_id' })
    }

    setup().catch(console.error)
  }, [])

  return null
}
