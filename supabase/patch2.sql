-- Fix whatsapp_groups missing columns
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS is_verified boolean default false;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS is_featured boolean default false;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS member_count int default 0;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS description text;

-- Fix profiles missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_top_student boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_views int default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos text[] default '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests text[] default '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS year_of_study int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS course text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university text;
