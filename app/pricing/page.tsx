import { CheckCircle, Star, Crown, Zap, MessageCircle } from 'lucide-react'

const PLANS = [
  {
    name: 'Top Student',
    price: 'KES 100',
    period: 'One-Time',
    icon: Star,
    color: 'border-orange-300',
    badge: 'text-orange-500',
    bg: 'bg-orange-50',
    features: ['Top Student badge on your profile', 'Priority placement in listings', 'Amber highlighted card', 'Increased visibility in search'],
  },
  {
    name: 'Premium',
    price: 'KES 199',
    period: 'Per Month',
    icon: Crown,
    color: 'border-purple-500',
    badge: 'text-purple-600',
    bg: 'bg-purple-50',
    featured: true,
    features: ['Premium badge on your profile', 'Priority ranking in search', 'Purple highlighted card', 'Homepage featured placement', 'Profile view analytics'],
  },
  {
    name: 'Featured',
    price: 'KES 200',
    period: 'One-Time',
    icon: Zap,
    color: 'border-blue-300',
    badge: 'text-blue-500',
    bg: 'bg-blue-50',
    features: ['Homepage Featured section', 'Top of Discover results', 'Featured badge on profile', 'Highlighted card design'],
  },
]

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-500">All payments via M-Pesa to <strong className="text-gray-800">0790166252</strong></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const Icon = plan.icon
          return (
            <div key={plan.name} className={`relative rounded-2xl border-2 ${plan.color} bg-white overflow-hidden ${plan.featured ? 'shadow-2xl scale-105' : 'shadow-md'}`}>
              {plan.featured && (
                <div className="gradient-purple text-white text-xs font-bold text-center py-1.5">MOST POPULAR</div>
              )}
              <div className={`${plan.bg} p-6 border-b ${plan.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <Icon size={28} className={plan.badge} />
                  <span className={`text-sm font-semibold ${plan.badge}`}>{plan.name}</span>
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mt-3">{plan.price}</div>
                <div className="text-sm text-gray-500 mt-0.5">{plan.period}</div>
              </div>
              <div className="p-6">
                <ul className="space-y-3 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`https://wa.me/254790166252?text=Hello%20CampusLink%20KE%2C%20I%20have%20completed%20payment%20for%20${encodeURIComponent(plan.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold transition-all ${plan.featured ? 'gradient-orange text-white shadow-lg hover:opacity-90' : 'border-2 border-gray-200 text-gray-700 hover:border-orange-400 hover:text-orange-500'}`}>
                  <MessageCircle size={16} /> Pay KES &amp; Confirm
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-10 bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <h3 className="font-bold text-gray-900 mb-2">How Payment Works</h3>
        <ol className="text-sm text-gray-600 space-y-1 max-w-md mx-auto text-left list-decimal list-inside">
          <li>Send M-Pesa payment to <strong>0790166252</strong></li>
          <li>Click "Pay KES &amp; Confirm" button above</li>
          <li>Send us your M-Pesa confirmation message on WhatsApp</li>
          <li>Admin approves your upgrade within a few hours</li>
        </ol>
      </div>
    </div>
  )
}
