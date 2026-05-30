import type { Metadata, Viewport } from 'next'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import ToastContainer from '@/components/Toast'
import ThemeProvider from '@/components/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'CampusLink KE — Meet People in Kenya',
  description: 'Connect with students and young professionals near you in Kenya.',
  manifest: '/manifest.json',
  icons: { apple: '/icon-192.png' },
  openGraph: {
    title: 'CampusLink KE',
    description: 'Meet people near you in Kenya',
    url: 'https://www.campuslink.co.ke',
    siteName: 'CampusLink KE',
    type: 'website',
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
