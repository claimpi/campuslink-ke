import './globals.css'
import Navbar from '@/components/layout/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CampusLink KE — Kenyan Student Network',
  description: 'Connect with students across Kenyan universities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{minHeight:'80vh'}}>{children}</main>
        <footer style={{background:'#0f172a',color:'#64748b',padding:'32px 20px',textAlign:'center',fontSize:'13px'}}>
          <p style={{color:'#94a3b8',fontWeight:'600',marginBottom:'4px'}}>CampusLink KE</p>
          <p>Connecting Kenyan university students</p>
          <p style={{marginTop:'8px'}}>© 2026 CampusLink KE</p>
        </footer>
      </body>
    </html>
  )
}
