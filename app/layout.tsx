import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusLink KE — Meet People Near You in Kenya',
  description: 'Meet, chat and connect with people near you in Kenya. Dating, friendships and networking. Join free.',
  keywords: ['dating Kenya','meet people Kenya','Nairobi dating app','Kenyan social app'],
  manifest: '/manifest.json',
  metadataBase: new URL('https://www.campuslink.co.ke'),
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'CampusLink KE — Meet People Near You in Kenya',
    description: 'Meet, chat and connect with people near you in Kenya. Join free.',
    url: 'https://www.campuslink.co.ke',
    siteName: 'CampusLink KE',
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', position: 'relative' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
