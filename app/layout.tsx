import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import ThemeProvider from '@/components/ThemeProvider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CampusLink KE — Kenyan Student Network',
  description: 'Connect with students across Kenyan universities. Find study partners, join WhatsApp groups and build your campus network.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: { url: '/icon-192.png', sizes: '192x192' },
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  themeColor: '#f97316',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
        <meta name="apple-mobile-web-app-title" content="CampusLink KE"/>
        <meta name="mobile-web-app-capable" content="yes"/>
      </head>
      <body style={{margin:0,padding:0,overscrollBehavior:'none'}}>
        <ThemeProvider>
        <Navbar />
        <main style={{minHeight:'80vh'}}>{children}</main>
        <footer style={{background:'#0f172a',color:'#64748b',padding:'32px 20px',textAlign:'center',fontSize:'13px'}} className="desktop-footer">
          <p style={{color:'#94a3b8',fontWeight:'600',marginBottom:'4px'}}>CampusLink KE</p>
          <p>Connecting Kenyan university students</p>
          <p style={{marginTop:'8px'}}>© 2026 CampusLink KE</p>
        </footer>
        <BottomNav />
        </ThemeProvider>
        <style>{`@media(max-width:767px){.desktop-footer{display:none}}`}</style>
      </body>
    </html>
  )
}
