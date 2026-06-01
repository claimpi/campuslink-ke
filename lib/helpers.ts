// Shared helpers used across the app

export function initials(n: string): string {
  return (n || '?').split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2)
}

export function calcDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function timeAgo(ts: string | null): string {
  if (!ts) return ''
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (m < 2) return 'Active now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function isOnline(ts: string | null): boolean {
  if (!ts) return false
  return (Date.now() - new Date(ts).getTime()) / 60000 < 5
}

export function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`
}
