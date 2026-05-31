CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'like','match','follow','daily_reward','super_like','gift','message'
  title TEXT NOT NULL,
  body TEXT,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notif_user ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Users mark own read" ON notifications
  FOR UPDATE USING (auth.uid()=user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
