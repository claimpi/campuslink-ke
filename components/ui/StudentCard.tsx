import Link from 'next/link'
import { MapPin, BookOpen, MessageCircle, Star, Crown, Zap } from 'lucide-react'
import { getInitials } from '@/lib/utils'

type Props = {
  id: string
  full_name: string
  university: string
  course: string
  year_of_study: number
  interests?: string[]
  avatar_url?: string
  is_premium?: boolean
  is_featured?: boolean
  is_top_student?: boolean
}

export default function StudentCard({
  id, full_name, university, course, year_of_study,
  interests = [], avatar_url, is_premium, is_featured, is_top_student
}: Props) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-md card-hover overflow-hidden border ${is_featured ? 'border-purple-200' : is_top_student ? 'border-orange-200' : 'border-gray-100'}`}>
      {/* Top banner */}
      {is_top_student && (
        <div className="gradient-orange text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1">
          <Star size={12} fill="white" /> TOP STUDENT
        </div>
      )}
      {is_featured && !is_top_student && (
        <div className="gradient-purple text-white text-xs font-bold text-center py-1.5 flex items-center justify-center gap-1">
          <Zap size={12} fill="white" /> FEATURED
        </div>
      )}

      <div className="p-5">
        {/* Avatar */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${is_premium ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-400' : 'bg-orange-100 text-orange-600'}`}>
            {avatar_url ? <img src={avatar_url} alt={full_name} className="w-full h-full rounded-full object-cover" /> : getInitials(full_name)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{full_name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Year {year_of_study}</span>
              {is_premium && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Crown size={10} /> Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen size={14} className="text-orange-400" />
            <span className="truncate">{course}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} className="text-orange-400" />
            <span className="truncate">{university}</span>
          </div>
        </div>

        {/* Interests */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {interests.slice(0, 3).map((i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{i}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/profile/${id}`} className="flex-1 text-center text-sm border border-gray-200 text-gray-700 py-2 rounded-xl hover:border-orange-300 hover:text-orange-600 transition-all font-medium">
            View
          </Link>
          <button className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl transition-all font-medium">
            <MessageCircle size={14} /> Chat
          </button>
        </div>
      </div>
    </div>
  )
}
