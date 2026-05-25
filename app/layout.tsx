import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'CampusLink KE – Kenyan Student Network',
  description: 'Connect with students across Kenyan universities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen" style={{fontFamily:'system-ui,sans-serif'}}>
        <Navbar />
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm mt-16">
          <p>© 2025 CampusLink KE — Connecting Kenyan Students</p>
          <p className="mt-1 text-xs">M-Pesa Payments: 0790166252</p>
        </footer>
      </body>
    </html>
  )
}
