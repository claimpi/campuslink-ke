-- CampusLink KE Database Schema

-- Users (extends Supabase auth.users)
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  full_name text not null,
  university text,
  course text,
  year_of_study int,
  bio text,
  whatsapp_number text,
  interests text[] default '{}',
  avatar_url text,
  photos text[] default '{}',
  is_premium boolean default false,
  is_featured boolean default false,
  is_top_student boolean default false,
  is_verified boolean default false,
  is_admin boolean default false,
  profile_views int default 0,
  premium_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- WhatsApp Groups
create table whatsapp_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  university text,
  category text,
  whatsapp_link text not null,
  added_by uuid references profiles(id),
  is_verified boolean default false,
  is_featured boolean default false,
  member_count int default 0,
  created_at timestamptz default now()
);

-- Unlock Requests
create table unlock_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id),
  target_id uuid references profiles(id),
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- Payment Requests
create table payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text not null check (type in ('premium','featured','top_student','unlock')),
  amount int not null,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- Announcements
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table whatsapp_groups enable row level security;
alter table unlock_requests enable row level security;
alter table payment_requests enable row level security;
alter table announcements enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

create policy "Groups viewable by everyone" on whatsapp_groups for select using (true);
create policy "Authenticated users can add groups" on whatsapp_groups for insert with check (auth.role() = 'authenticated');

create policy "Announcements viewable by everyone" on announcements for select using (true);

-- Indexes
create index idx_profiles_university on profiles(university);
create index idx_profiles_course on profiles(course);
create index idx_profiles_is_featured on profiles(is_featured);
create index idx_profiles_is_premium on profiles(is_premium);
create index idx_groups_university on whatsapp_groups(university);
create index idx_groups_verified on whatsapp_groups(is_verified);
