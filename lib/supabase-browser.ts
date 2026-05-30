import { createBrowserClient } from '@supabase/ssr'

// Custom storage that uses cookies for PKCE verifier
// This fixes the "PKCE code verifier not found" error in WebViews
// where localStorage is not shared across browser contexts
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return
    // 10 min expiry for PKCE verifier, 1 year for session
    const isPKCE = key.includes('code-verifier') || key.includes('pkce')
    const maxAge = isPKCE ? 600 : 365 * 24 * 60 * 60
    document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax;Secure`
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return
    document.cookie = `${key}=;path=/;max-age=0`
  },
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'campuslink-auth',
        storage: cookieStorage,
        flowType: 'pkce',
        detectSessionInUrl: true,
      }
    }
  )
}
