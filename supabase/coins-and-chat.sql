-- Coins balance on profiles (add if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_messages_used INTEGER DEFAULT 0;

-- Coin transactions log
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = credit, negative = debit
  type TEXT NOT NULL, -- 'purchase','message_sent','gift_sent','gift_received','referral','welcome'
  description TEXT,
  ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- In-app messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_free BOOLEAN DEFAULT false,
  coins_spent INTEGER DEFAULT 0,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_conversation ON messages(sender_id, receiver_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own messages" ON messages
  FOR SELECT USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()=sender_id);
CREATE POLICY "Users mark read" ON messages
  FOR UPDATE USING (auth.uid()=receiver_id);
CREATE POLICY "Users see own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid()=user_id);

-- Coin transfers between users
CREATE TABLE IF NOT EXISTS coin_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coin_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transfers" ON coin_transfers
  FOR SELECT USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
CREATE POLICY "Users send transfers" ON coin_transfers
  FOR INSERT WITH CHECK (auth.uid()=sender_id);

-- Daily login rewards
CREATE TABLE IF NOT EXISTS daily_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rewarded_at DATE DEFAULT CURRENT_DATE,
  coins_earned INTEGER DEFAULT 5,
  streak INTEGER DEFAULT 1,
  UNIQUE(user_id, rewarded_at)
);
ALTER TABLE daily_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rewards" ON daily_rewards FOR SELECT USING (auth.uid()=user_id);

-- Stories/Status
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  caption TEXT,
  views INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stories" ON stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Users manage own stories" ON stories FOR ALL USING (auth.uid()=user_id);

-- Story views
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own story views" ON story_views FOR SELECT USING (auth.uid()=viewer_id);
CREATE POLICY "Users can view stories" ON story_views FOR INSERT WITH CHECK (auth.uid()=viewer_id);

-- Super likes
CREATE TABLE IF NOT EXISTS super_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  coins_spent INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);
ALTER TABLE super_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own super likes" ON super_likes FOR SELECT USING (auth.uid()=sender_id OR auth.uid()=receiver_id);
CREATE POLICY "Users send super likes" ON super_likes FOR INSERT WITH CHECK (auth.uid()=sender_id);
