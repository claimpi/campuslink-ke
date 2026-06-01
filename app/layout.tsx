import type { Metadata, Viewport } from 'next'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import ToastContainer from '@/components/Toast'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusLink KE — Meet People Near You in Kenya',
  description: 'Meet, chat and connect with people near you in Kenya. Dating, friendships and networking for young Kenyans. Join free — no subscriptions needed.',
  keywords: ['dating Kenya', 'meet people Kenya', 'Nairobi dating app', 'Kenyan social app', 'meet singles Kenya', 'campuslink'],
  manifest: '/manifest.json',
  icons: { apple: '/icon-192.png' },
  metadataBase: new URL('https://www.campuslink.co.ke'),
  alternates: { canonical: 'https://www.campuslink.co.ke' },
  openGraph: {
    title: 'CampusLink KE — Meet People Near You in Kenya',
    description: 'Meet, chat and connect with people near you in Kenya. Join free today.',
    url: 'https://www.campuslink.co.ke',
    siteName: 'CampusLink KE',
    type: 'website',
    locale: 'en_KE',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CampusLink KE — Meet People Near You' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusLink KE — Meet People Near You in Kenya',
    description: 'Meet, chat and connect with people near you in Kenya. Join free.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{margin:0,padding:0,background:'#f8fafc',fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <ThemeProvider>
          <Navbar />
          <main style={{minHeight:'100vh'}}>
            {children}
          </main>
          <BottomNav />
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  )
}
