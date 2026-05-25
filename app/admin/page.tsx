'use client'
import { useState } from 'react'
import { Users, Crown, Star, Zap, Clock, Trash2, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

const MOCK_STUDENTS = [
  { id: '1', name: 'Samuel Nderitu', course: 'Math', university: 'Africa Nazarene University', is_top: true, is_premium: true, is_featured: true, year: 6 },
  { id: '2', name: 'Amina Wanjiku', course: 'Computer Science', university: 'University of Nairobi', is_top: false, is_premium: true, is_featured: false, year: 2 },
]

const MOCK_REQUESTS = [
  { id: '1', name: 'John Kamau', type: 'Premium', amount: 'KES 199', status: 'pending' },
  { id: '2', name: 'Faith Njeri', type: 'Featured', amount: 'KES 200', status: 'pending' },
  { id: '3', name: 'Mark Otieno', type: 'Top Student', amount: 'KES 100', status: 'pending' },
]

type Tab = 'students' | 'groups' | 'requests' | 'announce'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('students')

  const stats = [
    { label: 'Total Students', value: 1, icon: Users, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Premium', value: 1, icon: Crown, color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'Featured', value: 1, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'Pending Requests', value: 3, icon: Clock, color: 'text-red-500', bg: 'bg-red-100' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 gradient-orange rounded-xl flex items-center justify-center">
            <Star size={24} className="text-white" fill="white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">CampusLink KE Management</p>
          </div>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-all">
          <ExternalLink size={14} /> Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-xl p-1 flex gap-1 mb-6">
        {(['students', 'groups', 'requests', 'announce'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'announce' ? 'Announce' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {tab === 'students' && (
        <div className="space-y-3">
          <div className="relative mb-4">
            <input placeholder="Search by name, course, university or phone..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 pl-10" />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          </div>
          {MOCK_STUDENTS.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                  {s.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.course} · {s.university}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {s.is_top && <span className="text-xs gradient-orange text-white px-2 py-0.5 rounded-full">TOP</span>}
                  {s.is_premium && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PRO</span>}
                  {s.is_featured && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">FT</span>}
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Y{s.year}</span>
                </div>
                <div className="flex gap-1 ml-2">
                  <button className="w-8 h-8 rounded-lg bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center text-yellow-600 transition-all"><Star size={14} /></button>
                  <button className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600 transition-all"><Crown size={14} /></button>
                  <button className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-all"><Zap size={14} /></button>
                  <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all"><ExternalLink size={14} /></button>
                  <button className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Payment Requests</h2>
          {MOCK_REQUESTS.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{r.name}</div>
                <div className="text-xs text-gray-500">{r.type} · {r.amount}</div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                  <CheckCircle size={13} /> Approve
                </button>
                <button className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                  <XCircle size={13} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Groups Tab */}
      {tab === 'groups' && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p>No groups pending approval.</p>
        </div>
      )}

      {/* Announce Tab */}
      {tab === 'announce' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Post Announcement</h2>
          <div className="space-y-3">
            <input placeholder="Announcement title" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            <textarea placeholder="Announcement content..." rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
            <button className="gradient-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all">Post Announcement</button>
          </div>
        </div>
      )}
    </div>
  )
}
