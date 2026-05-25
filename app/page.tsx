import Link from 'next/link'
import { Users, MessageCircle, Star, Zap, Crown, ArrowRight, CheckCircle } from 'lucide-react'

const MOCK_STUDENTS = [
  { id: '1', name: 'Amina Wanjiku', university: 'University of Nairobi', course: 'Computer Science', year: 2, is_premium: true, is_featured: true },
  { id: '2', name: 'Brian Ochieng', university: 'Kenyatta University', course: 'Business Admin', year: 3, is_top: true },
  { id: '3', name: 'Catherine Muthoni', university: 'Strathmore University', course: 'Law', year: 1 },
  { id: '4', name: 'Dennis Kipchoge', university: 'JKUAT', course: 'Mechanical Engineering', year: 4, is_premium: true },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-purple-50 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap size={14} /> Kenya's #1 Student Network
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
            Connect with Students<br />
            <span className="text-orange-500">Across Kenya</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Find study partners, join WhatsApp groups, unlock contacts, and build your campus network — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="gradient-orange text-white px-8 py-3.5 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
              Join Free <ArrowRight size={18} />
            </Link>
            <Link href="/discover" className="border-2 border-orange-500 text-orange-500 px-8 py-3.5 rounded-full font-bold text-lg hover:bg-orange-50 transition-all">
              Browse Students
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[['500+', 'Students'], ['50+', 'Universities'], ['200+', 'WhatsApp Groups'], ['1K+', 'Connections']].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-extrabold text-orange-500">{n}</div>
                <div className="text-sm text-gray-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Students */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="text-orange-500" size={22} /> Featured Students</h2>
          <Link href="/discover" className="text-orange-500 hover:underline text-sm font-medium flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_STUDENTS.map(s => (
            <div key={s.id} className={`bg-white rounded-2xl shadow-md overflow-hidden border card-hover ${s.is_featured ? 'border-purple-200' : s.is_top ? 'border-orange-200' : 'border-gray-100'}`}>
              {s.is_top && <div className="gradient-orange text-white text-xs font-bold text-center py-1.5">⭐ TOP STUDENT</div>}
              {s.is_featured && <div className="gradient-purple text-white text-xs font-bold text-center py-1.5">✨ FEATURED</div>}
              <div className="p-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-3 ${s.is_premium ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                  {getInitials(s.name)}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{s.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{s.course}</p>
                <p className="text-xs text-gray-400">{s.university}</p>
                <div className="flex gap-1 mt-2">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Y{s.year}</span>
                  {s.is_premium && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Premium</span>}
                </div>
                <Link href={`/profile/${s.id}`} className="mt-3 block text-center text-xs bg-orange-500 text-white py-1.5 rounded-lg hover:bg-orange-600 transition-all font-medium">View Profile</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">Everything You Need to Connect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, title: 'Student Profiles', desc: 'Create your profile, add your course, university, and interests.', color: 'bg-orange-100 text-orange-600' },
              { icon: MessageCircle, title: 'WhatsApp Groups', desc: 'Discover and join verified WhatsApp groups for your university.', color: 'bg-green-100 text-green-600' },
              { icon: Star, title: 'Get Featured', desc: 'Appear on the homepage and top search results for just KES 200.', color: 'bg-yellow-100 text-yellow-600' },
              { icon: Crown, title: 'Premium Membership', desc: 'Unlimited unlocks, premium badge, analytics — KES 199/month.', color: 'bg-purple-100 text-purple-600' },
              { icon: Zap, title: 'Unlock Contacts', desc: 'Access WhatsApp numbers of students you want to connect with.', color: 'bg-blue-100 text-blue-600' },
              { icon: CheckCircle, title: 'Verified Groups', desc: 'All groups are verified by our admin team for quality.', color: 'bg-teal-100 text-teal-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-all text-left">
                <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}><Icon size={20} /></div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-14 px-4 bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple, Transparent Pricing</h2>
          <p className="text-gray-500 mb-10">All payments via M-Pesa to <strong>0790166252</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Top Student', price: 'KES 100', period: 'One-Time', color: 'border-orange-300 bg-orange-50', badge: '⭐' },
              { name: 'Premium', price: 'KES 199', period: 'Per Month', color: 'border-purple-400 bg-purple-50 scale-105 shadow-xl', badge: '👑' },
              { name: 'Featured', price: 'KES 200', period: 'One-Time', color: 'border-blue-300 bg-blue-50', badge: '✨' },
            ].map(p => (
              <div key={p.name} className={`rounded-2xl border-2 p-6 ${p.color} transition-all`}>
                <div className="text-3xl mb-2">{p.badge}</div>
                <h3 className="font-bold text-lg text-gray-900">{p.name}</h3>
                <div className="text-3xl font-extrabold text-gray-900 my-3">{p.price}</div>
                <p className="text-sm text-gray-500 mb-4">{p.period}</p>
                <Link href="/pricing" className="block text-center gradient-orange text-white py-2 rounded-xl font-medium text-sm hover:opacity-90 transition-all">Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Ready to Join the Network?</h2>
          <p className="text-gray-500 mb-8">Join hundreds of Kenyan students already connecting on CampusLink KE.</p>
          <Link href="/register" className="gradient-orange text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
