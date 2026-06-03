-- Enable UUID
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique,
  nickname text,
  email text,
  full_name text,
  avatar_url text,
  photos text[] default '{}',
  birth_date date,
  age int,
  gender text,
  orientation text default 'straight',
  show_me text default 'everyone',
  looking_for text,
  interests text[] default '{}',
  bio text,
  location_name text,
  latitude float,
  longitude float,
  distance_pref int default 100,
  coins int default 20,
  is_premium boolean default false,
  is_verified boolean default false,
  is_featured boolean default false,
  referral_code text unique,
  referred_by uuid references profiles(id),
  referral_credited boolean default false,
  last_seen timestamptz default now(),
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public read" on profiles for select using (true);
create policy "Users update own" on profiles for update using (auth.uid()=id);
create policy "Users insert own" on profiles for insert with check (auth.uid()=id);

-- LIKES
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(sender_id, receiver_id)
);
alter table likes enable row level security;
create policy "Users manage own likes" on likes for all using (auth.uid()=sender_id);
create policy "Users see received likes" on likes for select using (auth.uid()=receiver_id);

-- MATCHES
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade,
  user2_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);
alter table matches enable row level security;
create policy "Users see own matches" on matches for select using (auth.uid()=user1_id or auth.uid()=user2_id);

-- MESSAGES
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text not null,
  is_free boolean default false,
  coins_spent int default 0,
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table messages enable row level security;
create policy "Users see own messages" on messages for select using (auth.uid()=sender_id or auth.uid()=receiver_id);
create policy "Users send messages" on messages for insert with check (auth.uid()=sender_id);
create policy "Users update own messages" on messages for update using (auth.uid()=receiver_id);

-- COIN TRANSACTIONS
create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  amount int not null,
  type text not null,
  description text,
  created_at timestamptz default now()
);
alter table coin_transactions enable row level security;
create policy "Users see own transactions" on coin_transactions for select using (auth.uid()=user_id);

-- DAILY REWARDS
create table if not exists daily_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  rewarded_at date default current_date,
  coins_earned int default 5,
  streak int default 1,
  unique(user_id, rewarded_at)
);
alter table daily_rewards enable row level security;
create policy "Users see own rewards" on daily_rewards for select using (auth.uid()=user_id);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  from_user_id uuid references profiles(id) on delete set null,
  url text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Users see own notifs" on notifications for select using (auth.uid()=user_id);
create policy "Users update own notifs" on notifications for update using (auth.uid()=user_id);

-- REFERRALS
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade,
  amount int default 50,
  status text default 'credited',
  created_at timestamptz default now()
);
alter table referrals enable row level security;
create policy "Users see own referrals" on referrals for select using (auth.uid()=referrer_id);

-- PAYMENT REQUESTS
create table if not exists payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  order_tracking_id text unique,
  merchant_reference text,
  type text,
  amount numeric,
  status text default 'pending',
  created_at timestamptz default now()
);
alter table payment_requests enable row level security;
create policy "Users see own payments" on payment_requests for select using (auth.uid()=user_id);

-- Enable realtime
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table likes;

-- Storage bucket for avatars (run separately in dashboard)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
