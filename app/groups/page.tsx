'use client'
import { useState } from 'react'
import { Search, Plus, CheckCircle, Users, ExternalLink } from 'lucide-react'

const MOCK_GROUPS = [
  { id: '1', name: 'UoN CS Students 2024', university: 'University of Nairobi', category: 'Technology', description: 'Computer Science students at UoN. Share notes, assignments, and opportunities.', member_count: 245, is_verified: true, is_featured: true, link: 'https://chat.whatsapp.com/example1' },
  { id: '2', name: 'KU Business Network', university: 'Kenyatta University', category: 'Business', description: 'Business students networking and sharing opportunities.', member_count: 180, is_verified: true, link: 'https://chat.whatsapp.com/example2' },
  { id: '3', name: 'Strathmore Law Society', university: 'Strathmore University', category: 'Law', description: 'Law students at Strathmore sharing resources and case studies.', member_count: 120, is_verified: false, link: 'https://chat.whatsapp.com/example3' },
  { id: '4', name: 'JKUAT Engineering Hub', university: 'JKUAT', category: 'Engineering', description: 'Engineers connecting, sharing projects and internship opportunities.', member_count: 310, is_verified: true, link: 'https://chat.whatsapp.com/example4' },
]

const UNIVERSITIES = ['All Universities', 'University of Nairobi', 'Kenyatta University', 'Strathmore University', 'JKUAT']
const CATEGORIES = ['All Categories', 'Technology', 'Business', 'Law', 'Engineering', 'Medicine', 'Arts']

export default function GroupsPage() {
  const [search, setSearch] = useState('')
  const [university, setUniversity] = useState('All Universities')
  const [category, setCategory] = useState('All Categories')
  const [showAdd, setShowAdd] = useState(false)

  const filtered = MOCK_GROUPS.filter(g => {
    const matchSearch = search === '' || g.name.toLowerCase().includes(search.toLowerCase())
    const matchUni = university === 'All Universities' || g.university === university
    const matchCat = category === 'All Categories' || g.category === category
    return matchSearch && matchUni && matchCat
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="text-green-500">💬</span> WhatsApp Groups
          </h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} groups across Kenyan universities</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 gradient-orange text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-md hover:opacity-90 transition-all">
          <Plus size={16} /> Add Group
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 bg-white" />
        </div>
        <select value={university} onChange={e => setUniversity(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white">
          {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Groups grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">💬</div>
          <p>No groups found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(g => (
            <div key={g.id} className={`bg-white rounded-2xl border shadow-md card-hover overflow-hidden ${g.is_featured ? 'border-purple-200' : 'border-gray-100'}`}>
              {g.is_featured && <div className="gradient-purple text-white text-xs font-bold text-center py-1">✨ FEATURED GROUP</div>}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{g.name}</h3>
                  {g.is_verified && <CheckCircle size={16} className="text-green-500 shrink-0 ml-2" />}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{g.university.split(' ').slice(0,2).join(' ')}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{g.category}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{g.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={12} /> {g.member_count} members</span>
                  <a href={g.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-all">
                    Join <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Group Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add WhatsApp Group</h2>
            <div className="space-y-3">
              <input placeholder="Group name" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="WhatsApp invite link" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
              <textarea placeholder="Group description" rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400">
                {UNIVERSITIES.slice(1).map(u => <option key={u}>{u}</option>)}
              </select>
              <select className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400">
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => setShowAdd(false)} className="flex-1 gradient-orange text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all">Submit Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
