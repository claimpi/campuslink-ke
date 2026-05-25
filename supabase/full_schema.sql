-- ============================================
-- CampusLink KE — Full Database Schema
-- Safe to run even if tables already exist
-- ============================================

-- ── PROFILES ────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL DEFAULT '',
  university text,
  course text,
  year_of_study int,
  bio text,
  whatsapp_number text,
  interests text[] DEFAULT '{}',
  avatar_url text,
  photos text[] DEFAULT '{}',
  is_premium boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_top_student boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  profile_views int DEFAULT 0,
  premium_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns safely
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_top_student boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── WHATSAPP GROUPS ──────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  university text,
  category text,
  whatsapp_link text NOT NULL DEFAULT '',
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  member_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS university text;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS member_count int DEFAULT 0;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS added_by uuid;

-- ── PAYMENT REQUESTS ─────────────────────────
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'premium',
  amount int NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  reference text,
  order_tracking_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS order_tracking_id text;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS type text DEFAULT 'premium';
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS amount int DEFAULT 0;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- ── ANNOUNCEMENTS ────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by uuid;

-- ── UNLOCK REQUESTS ──────────────────────────
CREATE TABLE IF NOT EXISTS unlock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  target_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ── ROW LEVEL SECURITY ───────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlock_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Groups viewable by everyone" ON whatsapp_groups;
DROP POLICY IF EXISTS "Groups viewable by all" ON whatsapp_groups;
DROP POLICY IF EXISTS "Authenticated users can add groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "Anyone can add groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "Anyone can update groups" ON whatsapp_groups;
DROP POLICY IF EXISTS "Announcements viewable by everyone" ON announcements;
DROP POLICY IF EXISTS "Announcements viewable by all" ON announcements;
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
DROP POLICY IF EXISTS "Anyone can insert payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Anyone can view payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Anyone can update payment requests" ON payment_requests;
DROP POLICY IF EXISTS "Users insert payment requests" ON payment_requests;

-- ── PROFILES POLICIES ────────────────────────
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- ── WHATSAPP GROUPS POLICIES ─────────────────
CREATE POLICY "groups_select" ON whatsapp_groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON whatsapp_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON whatsapp_groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete" ON whatsapp_groups FOR DELETE USING (true);

-- ── PAYMENT REQUESTS POLICIES ────────────────
CREATE POLICY "payments_select" ON payment_requests FOR SELECT USING (true);
CREATE POLICY "payments_insert" ON payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "payments_update" ON payment_requests FOR UPDATE USING (true);

-- ── ANNOUNCEMENTS POLICIES ───────────────────
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_insert" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "announcements_update" ON announcements FOR UPDATE USING (true);

-- ── UNLOCK REQUESTS POLICIES ─────────────────
CREATE POLICY "unlocks_select" ON unlock_requests FOR SELECT USING (true);
CREATE POLICY "unlocks_insert" ON unlock_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "unlocks_update" ON unlock_requests FOR UPDATE USING (true);

-- ── INDEXES ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_university ON profiles(university);
CREATE INDEX IF NOT EXISTS idx_profiles_course ON profiles(course);
CREATE INDEX IF NOT EXISTS idx_profiles_is_featured ON profiles(is_featured);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_is_top ON profiles(is_top_student);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_university ON whatsapp_groups(university);
CREATE INDEX IF NOT EXISTS idx_groups_verified ON whatsapp_groups(is_verified);
CREATE INDEX IF NOT EXISTS idx_groups_featured ON whatsapp_groups(is_featured);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payments_tracking ON payment_requests(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payment_requests(reference);

-- ── STORAGE BUCKETS ──────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload photos" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Photos are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Users can upload photos"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');

-- ── DONE ─────────────────────────────────────
-- All tables, columns, policies, indexes and
-- storage buckets are now set up for CampusLink KE
