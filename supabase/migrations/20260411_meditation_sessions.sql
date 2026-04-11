-- meditation_sessions: 記錄每次冥想計時器的使用記錄
CREATE TABLE meditation_sessions (
  id               UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID         REFERENCES auth.users(id) NOT NULL,
  started_at       TIMESTAMPTZ  NOT NULL,
  duration_seconds INTEGER      NOT NULL,   -- 實際冥想秒數
  target_seconds   INTEGER      NOT NULL,   -- 計畫冥想秒數
  completed        BOOLEAN      DEFAULT false,
  meditation_type  TEXT,
  note             TEXT,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- Row Level Security: 只有本人可讀寫自己的記錄
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own sessions"
  ON meditation_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for performance: 按使用者 + 時間查詢
CREATE INDEX idx_meditation_sessions_user_started
  ON meditation_sessions (user_id, started_at DESC);
