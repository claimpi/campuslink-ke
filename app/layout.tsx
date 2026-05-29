import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import ToastContainer from '@/components/Toast'
import InstallBanner from '@/components/InstallBanner'
import PushNotifications from '@/components/PushNotifications'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CampusLink KE — Meet People in Kenya',
  description: 'Meet people near you in Kenya. Connect, chat and find your match on CampusLink KE.',
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
        <meta property="og:title" content="CampusLink KE — Meet People in Kenya"/>
        <meta property="og:description" content="Connect, chat and find your match"/>
        <meta property="og:image" content="https://www.campuslink.co.ke/og-image.png"/>
        <meta property="og:image:width" content="1200"/>
        <meta property="og:image:height" content="630"/>
        <meta property="og:url" content="https://www.campuslink.co.ke"/>
        <meta property="og:type" content="website"/>
        <meta property="og:site_name" content="CampusLink KE"/>
        <meta name="twitter:card" content="summary_large_image"/>
        <meta name="twitter:title" content="CampusLink KE — Meet People in Kenya"/>
        <meta name="twitter:description" content="Connect, chat and find your match"/>
        <meta name="twitter:image" content="https://www.campuslink.co.ke/og-image.png"/>
        <meta name="mobile-web-app-capable" content="yes"/>
      </head>
      <body style={{margin:0,padding:0,overscrollBehavior:'none'}}>
        <Navbar />
        <main style={{minHeight:'80vh'}}>{children}</main>
        <footer style={{background:'#0f172a',color:'#64748b',padding:'32px 20px',textAlign:'center',fontSize:'13px'}} className="desktop-footer">
          <p style={{color:'#94a3b8',fontWeight:'600',marginBottom:'4px'}}>CampusLink KE</p>
          <p>Connecting Kenyan university users</p>
          <p style={{marginTop:'8px'}}>© 2026 CampusLink KE</p>
        </footer>
        <BottomNav />
        <ToastContainer />
        <InstallBanner />
        <PushNotifications />
        <style>{`@media(max-width:767px){.desktop-footer{display:none}}`}</style>
      </body>
    </html>
  )
}
