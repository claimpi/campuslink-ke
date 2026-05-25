'use client'
import { useState } from 'react'
import { MapPin, BookOpen, MessageCircle, Star, Crown, Zap, Eye, Phone } from 'lucide-react'

const MOCK_PROFILE = {
  id: '1', full_name: 'Amina Wanjiku', university: 'University of Nairobi', course: 'Computer Science',
  year_of_study: 2, bio: 'Passionate CS student at UoN. Interested in AI, web development and machine learning. Always happy to connect with fellow students!',
  interests: ['coding', 'AI', 'football', 'music', 'reading'],
  is_premium: true, is_featured: true, is_top_student: false,
  profile_views: 142, whatsapp_number: '+254712345678',
}

function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) }

export default function ProfilePage() {
  const [showUnlock, setShowUnlock] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const p = MOCK_PROFILE

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="h-28 gradient-orange relative">
          {p.is_featured && <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1"><Zap size={11} /> Featured</div>}
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-4 border-white shadow-md ${p.is_premium ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
              {getInitials(p.full_name)}
            </div>
            <div className="flex gap-1 mt-2">
              {p.is_top_student && <span className="text-xs gradient-orange text-white px-2 py-1 rounded-full flex items-center gap-1"><Star size={10} fill="white" /> Top</span>}
              {p.is_premium && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><Crown size={10} /> Premium</span>}
              {p.is_featured && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Zap size={10} /> Featured</span>}
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">{p.full_name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><BookOpen size={14} className="text-orange-400" /> {p.course}</span>
            <span className="flex items-center gap-1"><MapPin size={14} className="text-orange-400" /> {p.university}</span>
            <span className="flex items-center gap-1"><Eye size={14} className="text-orange-400" /> {p.profile_views} views</span>
          </div>

          <p className="text-gray-600 text-sm mt-4 leading-relaxed">{p.bio}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {p.interests.map(i => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{i}</span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowUnlock(true)} className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-600 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-all text-sm">
              <Phone size={16} /> {unlocked ? p.whatsapp_number : 'Unlock WhatsApp'}
            </button>
            <a href={`https://wa.me/254790166252`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-all text-sm">
              <MessageCircle size={16} /> Chat
            </a>
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Unlock WhatsApp Number</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 font-medium mb-1">Send payment via M-Pesa:</p>
              <p className="text-2xl font-extrabold text-orange-500">0790166252</p>
              <p className="text-xs text-gray-500 mt-1">After payment, click the WhatsApp button below to confirm.</p>
            </div>
            <a
              href="https://wa.me/254790166252?text=Hello%20CampusLink%20KE%2C%20I%20have%20completed%20payment."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold mb-3 transition-all">
              <MessageCircle size={16} /> Confirm on WhatsApp
            </a>
            <button onClick={() => setShowUnlock(false)} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
