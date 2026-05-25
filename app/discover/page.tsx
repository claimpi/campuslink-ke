'use client'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import StudentCard from '@/components/ui/StudentCard'
import { supabase } from '@/lib/supabase'

const MOCK_STUDENTS = [
  { id: '1', full_name: 'Amina Wanjiku', university: 'University of Nairobi', course: 'Computer Science', year_of_study: 2, interests: ['coding', 'AI'], is_premium: true, is_featured: true },
  { id: '2', full_name: 'Brian Ochieng', university: 'Kenyatta University', course: 'Business Administration', year_of_study: 3, interests: ['football', 'chess'], is_top_student: true },
  { id: '3', full_name: 'Catherine Muthoni', university: 'Strathmore University', course: 'Law', year_of_study: 1, interests: ['reading', 'debate'] },
  { id: '4', full_name: 'Dennis Kipchoge', university: 'JKUAT', course: 'Mechanical Engineering', year_of_study: 4, interests: ['robotics', 'sports'], is_premium: true },
  { id: '5', full_name: 'Esther Akinyi', university: 'Moi University', course: 'Medicine', year_of_study: 5, interests: ['health', 'research'] },
  { id: '6', full_name: 'Felix Njoroge', university: 'Africa Nazarene University', course: 'Math', year_of_study: 2, interests: ['football', 'music'], is_top_student: true },
]

const UNIVERSITIES = ['All Universities', 'University of Nairobi', 'Kenyatta University', 'Strathmore University', 'JKUAT', 'Moi University', 'Africa Nazarene University', 'Meru University', 'Egerton University', 'Maseno University']
const YEARS = ['All Years', '1', '2', '3', '4', '5', '6']

type Student = {
  id: string; full_name: string; university: string; course: string;
  year_of_study: number; interests?: string[]; avatar_url?: string;
  is_premium?: boolean; is_featured?: boolean; is_top_student?: boolean;
}

export default function DiscoverPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [university, setUniversity] = useState('All Universities')
  const [year, setYear] = useState('All Years')

  useEffect(() => {
    async function loadStudents() {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('is_featured', { ascending: false }).order('is_premium', { ascending: false })
        if (data && data.length > 0) {
          setStudents(data)
        } else {
          setStudents(MOCK_STUDENTS as Student[])
        }
      } catch {
        setStudents(MOCK_STUDENTS as Student[])
      }
      setLoading(false)
    }
    loadStudents()
  }, [])

  const filtered = students.filter(s => {
    const matchSearch = search === '' || s.full_name.toLowerCase().includes(search.toLowerCase()) || s.course?.toLowerCase().includes(search.toLowerCase())
    const matchUni = university === 'All Universities' || s.university === university
    const matchYear = year === 'All Years' || String(s.year_of_study) === year
    return matchSearch && matchUni && matchYear
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Browse Students</h1>
      <p className="text-gray-500 mb-6">Found {filtered.length} students.</p>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
            <div className="flex items-center gap-2 font-semibold text-gray-700">
              <Filter size={16} /> Filters
            </div>
            <div>
              <label className="text-sm font-medium text-orange-500 mb-1 block">University</label>
              <select value={university} onChange={e => setUniversity(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                {UNIVERSITIES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-orange-500 mb-1 block">Year of Study</label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={() => { setUniversity('All Universities'); setYear('All Years'); setSearch('') }} className="w-full text-sm text-orange-500 border border-orange-200 py-2 rounded-xl hover:bg-orange-50 transition-all">
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          <div className="relative mb-5">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search names, interests..." className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 bg-white shadow-sm text-sm" />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse">
                  <div className="h-8 bg-gray-100 rounded-t-2xl mb-4"></div>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3"><div className="w-14 h-14 bg-gray-200 rounded-full"></div><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-100 rounded w-1/2"></div></div></div>
                    <div className="h-3 bg-gray-100 rounded"></div><div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">No students found. Try different filters.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(s => <StudentCard key={s.id} {...s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
