'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Compass, MessageCircle, Star, Tag, Shield, User } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center text-white font-bold text-sm">CL</div>
          <span className="font-bold text-lg text-gray-900">CampusLink <span className="text-orange-500">KE</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { href: '/discover', label: 'Discover', icon: Compass },
            { href: '/groups', label: 'Groups', icon: MessageCircle },
            { href: '/discover?top=true', label: 'Top Students', icon: Star },
            { href: '/pricing', label: 'Pricing', icon: Tag },
            { href: '/admin', label: 'Admin', icon: Shield },
          ].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all">
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="text-sm text-gray-600 hover:text-orange-500 px-3 py-2 rounded-lg transition-all">Login</Link>
          <Link href="/register" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium transition-all shadow-md">Join Free</Link>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-orange-50">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-orange-100 px-4 py-3 space-y-1">
          {[
            { href: '/discover', label: 'Discover' },
            { href: '/groups', label: 'WhatsApp Groups' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/admin', label: 'Admin' },
            { href: '/login', label: 'Login' },
            { href: '/register', label: 'Join Free' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-orange-50 hover:text-orange-500 text-sm font-medium transition-all">
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
