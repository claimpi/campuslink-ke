'use client'
import { useState, useEffect } from 'react'
import { Users, Crown, Star, Zap, Clock, Trash2, ExternalLink, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Student = { id: string; full_name: string; course: string; university: string; is_top_student: boolean; is_premium: boolean; is_featured: boolean; year_of_study: number }
type Request = { id: string; full_name?: string; type: string; amount: number; status: string; user_id: string }

const MOCK_STUDENTS: Student[] = [
  { id: '1', full_name: 'Samuel Nderitu Muchugu', course: 'Math', university: 'Africa Nazarene University', is_top_student: true, is_premium: true, is_featured: true, year_of_study: 6 },
]
const MOCK_REQUESTS: Request[] = [
  { id: '1', full_name: 'John Kamau', type: 'Premium', amount: 199, status: 'pending', user_id: '1' },
  { id: '2', full_name: 'Faith Njeri', type: 'Featured', amount: 200, status: 'pending', user_id: '2' },
  { id: '3', full_name: 'Mark Otieno', type: 'Top Student', amount: 100, status: 'pending', user_id: '3' },
]

type Tab = 'students' | 'groups' | 'requests' | 'announce'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [announcement, setAnnouncement] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      const { data: payReqs } = await supabase.from('payment_requests').select('*, profiles(full_name)').eq('status', 'pending')
      setStudents(profiles && profiles.length > 0 ? profiles : MOCK_STUDENTS)
      setRequests(payReqs && payReqs.length > 0 ? payReqs.map((r: any) => ({ ...r, full_name: r.profiles?.full_name })) : MOCK_REQUESTS)
    } catch {
      setStudents(MOCK_STUDENTS)
      setRequests(MOCK_REQUESTS)
    }
    setLoading(false)
  }

  async function toggleBadge(id: string, field: string, current: boolean) {
    await supabase.from('profiles').update({ [field]: !current }).eq('id', id)
    setStudents(s => s.map(st => st.id === id ? { ...st, [field]: !current } : st))
  }

  async function approveRequest(id: string, userId: string, type: string) {
    await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', id)
    const update: any = {}
    if (type === 'Premium') update.is_premium = true
    if (type === 'Featured') update.is_featured = true
    if (type === 'Top Student') update.is_top_student = true
    if (Object.keys(update).length > 0) await supabase.from('profiles').update(update).eq('id', userId)
    setRequests(r => r.filter(req => req.id !== id))
  }

  async function rejectRequest(id: string) {
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id)
    setRequests(r => r.filter(req => req.id !== id))
  }

  async function deleteStudent(id: string) {
    if (!confirm('Delete this student?')) return
    await supabase.from('profiles').delete().eq('id', id)
    setStudents(s => s.filter(st => st.id !== id))
  }

  async function postAnnouncement() {
    if (!announcement.title || !announcement.content) return
    setSaving(true)
    await supabase.from('announcements').insert([announcement])
    setAnnouncement({ title: '', content: '' })
    setSaving(false)
    alert('Announcement posted!')
  }

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Premium', value: students.filter(s => s.is_premium).length, icon: Crown, color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'Featured', value: students.filter(s => s.is_featured).length, icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'Pending', value: requests.length, icon: Clock, color: 'text-red-500', bg: 'bg-red-100' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 gradient-orange rounded-xl flex items-center justify-center"><Star size={24} className="text-white" fill="white" /></div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">CampusLink KE Management</p>
          </div>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}><s.icon size={18} className={s.color} /></div>
              <div><div className="text-2xl font-extrabold text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 rounded-xl p-1 flex gap-1 mb-6">
        {(['students', 'groups', 'requests', 'announce'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'announce' ? 'Announce' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'requests' && requests.length > 0 && <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{requests.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="space-y-3">
          <input placeholder="Search students..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 mb-2" />
          {loading ? <div className="text-center py-8 text-gray-400">Loading students...</div> :
            students.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                    {s.full_name.split(' ').map((n:string)=>n[0]).join('').toUpperCase().slice(0,2)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{s.full_name}</div>
                    <div className="text-xs text-gray-500">{s.course} · {s.university}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1">
                    {s.is_top_student && <span className="text-xs gradient-orange text-white px-2 py-0.5 rounded-full">TOP</span>}
                    {s.is_premium && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">PRO</span>}
                    {s.is_featured && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">FT</span>}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Y{s.year_of_study}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleBadge(s.id, 'is_top_student', s.is_top_student)} title="Toggle Top" className="w-8 h-8 rounded-lg bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center text-yellow-600 transition-all"><Star size={14} /></button>
                    <button onClick={() => toggleBadge(s.id, 'is_premium', s.is_premium)} title="Toggle Premium" className="w-8 h-8 rounded-lg bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-600 transition-all"><Crown size={14} /></button>
                    <button onClick={() => toggleBadge(s.id, 'is_featured', s.is_featured)} title="Toggle Featured" className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 transition-all"><Zap size={14} /></button>
                    <a href={`/profile/${s.id}`} target="_blank" className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all"><ExternalLink size={14} /></a>
                    <button onClick={() => deleteStudent(s.id)} className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Payment Requests</h2>
          {requests.length === 0 ? <div className="text-center py-16 text-gray-400">No pending requests 🎉</div> :
            requests.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{r.full_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{r.type} · KES {r.amount}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveRequest(r.id, r.user_id, r.type)} className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                    <CheckCircle size={13} /> Approve
                  </button>
                  <button onClick={() => rejectRequest(r.id)} className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab === 'groups' && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">💬</div>
          <p>No groups pending approval.</p>
        </div>
      )}

      {tab === 'announce' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Post Announcement</h2>
          <div className="space-y-3">
            <input value={announcement.title} onChange={e => setAnnouncement(a => ({...a, title: e.target.value}))} placeholder="Announcement title" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            <textarea value={announcement.content} onChange={e => setAnnouncement(a => ({...a, content: e.target.value}))} placeholder="Announcement content..." rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
            <button onClick={postAnnouncement} disabled={saving} className="gradient-orange text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
