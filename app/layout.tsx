import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f43f5e',
}

export const metadata: Metadata = {
  title: 'CampusLink KE — Meet People Near You in Kenya',
  description: 'Meet, chat and connect with people near you in Kenya. Dating and friendships. Join free.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://www.campuslink.co.ke'),
  icons: { icon: '/icon.png', apple: '/icon.png' },
  openGraph: {
    title: 'CampusLink KE',
    description: 'Meet people near you in Kenya. Join free.',
    siteName: 'CampusLink KE',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative', background: '#fff', overflow: 'hidden' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
