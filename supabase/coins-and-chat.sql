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
