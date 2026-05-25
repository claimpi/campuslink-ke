-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views int default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos text[] default '{}';

-- Allow anyone to insert groups (not just authenticated)
DROP POLICY IF EXISTS "Authenticated users can add groups" ON whatsapp_groups;
CREATE POLICY "Anyone can add groups" ON whatsapp_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update groups" ON whatsapp_groups FOR UPDATE USING (true);

-- Allow payment_requests insert
DROP POLICY IF EXISTS "Users insert payment requests" ON payment_requests;
CREATE POLICY "Anyone can insert payment requests" ON payment_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view payment requests" ON payment_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can update payment requests" ON payment_requests FOR UPDATE USING (true);

-- Allow announcements insert  
CREATE POLICY "Admin can insert announcements" ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update announcements" ON announcements FOR UPDATE USING (true);
