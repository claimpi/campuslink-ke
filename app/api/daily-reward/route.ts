import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]

    // Check already claimed today
    const { data: existing } = await sb.from('daily_rewards')
      .select('id').eq('user_id', userId).eq('rewarded_at', today).maybeSingle()
    if (existing) return NextResponse.json({ alreadyClaimed: true })

    // Get yesterday's reward to calculate streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    const { data: yesterdayReward } = await sb.from('daily_rewards')
      .select('streak').eq('user_id', userId).eq('rewarded_at', yesterday).maybeSingle()

    const streak = (yesterdayReward?.streak || 0) + 1
    // Streak bonuses: day 3 = 15 coins, day 7 = 30 coins, else 5 coins
    const coins = streak === 7 ? 30 : streak === 3 ? 15 : 5

    // Insert reward
    await sb.from('daily_rewards').insert([{ user_id: userId, rewarded_at: today, coins_earned: coins, streak }])

    // Credit coins
    const { data: profile } = await sb.from('profiles').select('coins').eq('id', userId).maybeSingle()
    await sb.from('profiles').update({ coins: (profile?.coins || 0) + coins }).eq('id', userId)

    // Log transaction
    await sb.from('coin_transactions').insert([{
      user_id: userId, amount: coins, type: 'daily_reward',
      description: `Day ${streak} login reward${streak===7?' — Week streak bonus!':streak===3?' — 3-day streak bonus!':''}`
    }])

    return NextResponse.json({ success: true, coins, streak, newBalance: (profile?.coins || 0) + coins })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
