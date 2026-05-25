import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  user_id: string
  full_name: string
  university: string
  course: string
  year_of_study: number
  bio: string
  whatsapp_number: string
  interests: string[]
  avatar_url: string
  photos: string[]
  is_premium: boolean
  is_featured: boolean
  is_top_student: boolean
  is_verified: boolean
  profile_views: number
  created_at: string
}

export type WhatsAppGroup = {
  id: string
  name: string
  description: string
  university: string
  category: string
  whatsapp_link: string
  added_by: string
  is_verified: boolean
  is_featured: boolean
  member_count: number
  created_at: string
}

export type UnlockRequest = {
  id: string
  requester_id: string
  target_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export type Announcement = {
  id: string
  title: string
  content: string
  created_at: string
}
