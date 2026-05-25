'use client'
import { useState } from 'react'
import Link from 'next/link'

const UNIVERSITIES = ['University of Nairobi','Kenyatta University','Strathmore University','JKUAT','Moi University','Africa Nazarene University','Maseno University','Egerton University']

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', university:'', course:'', year:'1', whatsapp:'' })
  const set = (k:string) => (e:any) => setForm(f=>({...f,[k]:e.target.value}))
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 gradient-orange rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">CL</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Join CampusLink KE</h1>
          <p className="text-gray-500 text-sm mt-1">Connect with students across Kenya</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
            <input value={form.name} onChange={set('name')} placeholder="John Kamau" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">University</label>
            <select value={form.university} onChange={set('university')} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400">
              <option value="">Select university...</option>
              {UNIVERSITIES.map(u=><option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Course</label>
            <input value={form.course} onChange={set('course')} placeholder="e.g. Computer Science" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Year of Study</label>
            <select value={form.year} onChange={set('year')} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400">
              {['1','2','3','4','5','6'].map(y=><option key={y}>Year {y}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp Number</label>
            <input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+254712345678" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
          </div>
        </div>
        <button className="mt-5 w-full gradient-orange text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md">Create Account</button>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link href="/login" className="text-orange-500 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
