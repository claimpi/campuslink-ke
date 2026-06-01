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

async function saveSub(userId: string, sub: PushSubscription) {
  const subJson = sub.toJSON()
  const sb = createClient()
  const { error } = await sb.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subJson.endpoint,
    p256dh: (subJson.keys as any)?.p256dh,
    auth: (subJson.keys as any)?.auth,
  }, { onConflict: 'user_id' })
  if (error) console.error('Push sub save error:', error)
  else console.log('Push subscription saved ✅')
}

export async function setupPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported')
    return
  }

  try {
    // Register service worker
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    console.log('SW ready ✅')

    // Check permission
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return
    }

    // Get or create subscription
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      })
      console.log('New push subscription created ✅')
    } else {
      console.log('Existing push subscription found ✅')
    }

    await saveSub(userId, sub)
  } catch (e) {
    console.error('Push setup error:', e)
  }
}

export default function PushNotifications() {
  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data: { user } }: any) => {
      if (user) setupPush(user.id)
    })
  }, [])

  return null
}
