-- ============================================================
-- 即時通訊功能 Migration
-- 建立時間：2026-05-04
-- 包含：conversations, conversation_members, messages
--        RLS Policies, Indexes, Triggers, Realtime 設定
-- ============================================================


-- ============================================================
-- 1. 建立資料表
-- ============================================================

-- 對話（私訊 or 群組）
CREATE TABLE public.conversations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT,                                          -- 群組名稱（私訊時為 null）
  is_group    BOOLEAN     NOT NULL DEFAULT false,
  avatar_url  TEXT,                                          -- 群組大頭貼（可選）
  created_by  UUID        REFERENCES auth.users(id) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL             -- 最新訊息時間，用於排序
);

-- 對話成員
CREATE TABLE public.conversation_members (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   UUID        REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at         TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_read_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,      -- 最後已讀時間，用於計算未讀數
  UNIQUE (conversation_id, user_id)
);

-- 訊息
CREATE TABLE public.messages (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id   UUID        REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id         UUID        REFERENCES auth.users(id) NOT NULL,
  content           TEXT        NOT NULL,
  message_type      TEXT        NOT NULL DEFAULT 'text'      -- 'text' | 'image' | 'system'
                    CHECK (message_type IN ('text', 'image', 'system')),
  image_url         TEXT,                                    -- 圖片訊息用
  is_deleted        BOOLEAN     NOT NULL DEFAULT false,      -- 軟刪除
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);


-- ============================================================
-- 2. Trigger：新訊息時自動更新 conversations.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();


-- ============================================================
-- 3. Helper Function：確認當前使用者是否為對話成員
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conv_id
      AND user_id = auth.uid()
  );
$$;


-- ============================================================
-- 4. 啟用 RLS
-- ============================================================

ALTER TABLE public.conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages             ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 5. RLS Policies — conversations
-- ============================================================

-- 讀取：只有對話成員可讀
CREATE POLICY "conversations_select_member"
  ON public.conversations FOR SELECT
  USING (public.is_conversation_member(id));

-- 建立：任何已登入成員可建立對話
CREATE POLICY "conversations_insert_authenticated"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 更新：只有建立者可修改對話資訊（群組名稱等）
CREATE POLICY "conversations_update_creator"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);


-- ============================================================
-- 6. RLS Policies — conversation_members
-- ============================================================

-- 讀取：只有對話成員可查看成員列表
CREATE POLICY "conv_members_select_member"
  ON public.conversation_members FOR SELECT
  USING (public.is_conversation_member(conversation_id));

-- 加入：任何已登入成員可加入（包含建立對話時寫入自己）
CREATE POLICY "conv_members_insert_authenticated"
  ON public.conversation_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 更新：只有自己可更新自己的 last_read_at
CREATE POLICY "conv_members_update_self"
  ON public.conversation_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 離開：只有自己可刪除自己的成員資料
CREATE POLICY "conv_members_delete_self"
  ON public.conversation_members FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 7. RLS Policies — messages
-- ============================================================

-- 讀取：只有對話成員可讀
CREATE POLICY "messages_select_member"
  ON public.messages FOR SELECT
  USING (public.is_conversation_member(conversation_id));

-- 發送：只有對話成員可發訊息，且 sender_id 必須是自己
CREATE POLICY "messages_insert_member"
  ON public.messages FOR INSERT
  WITH CHECK (
    public.is_conversation_member(conversation_id)
    AND auth.uid() = sender_id
  );

-- 軟刪除：只有訊息本人可將 is_deleted 設為 true
CREATE POLICY "messages_update_sender"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);


-- ============================================================
-- 8. Indexes（效能最佳化）
-- ============================================================

-- 對話列表依最新訊息排序
CREATE INDEX idx_conversations_updated_at
  ON public.conversations (updated_at DESC);

-- 查詢某使用者的所有對話
CREATE INDEX idx_conv_members_user_id
  ON public.conversation_members (user_id);

-- 查詢某對話的所有成員
CREATE INDEX idx_conv_members_conversation_id
  ON public.conversation_members (conversation_id);

-- 查詢某對話的訊息（依時間）
CREATE INDEX idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);

-- 查詢某使用者發送的訊息
CREATE INDEX idx_messages_sender_id
  ON public.messages (sender_id);


-- ============================================================
-- 9. 啟用 Supabase Realtime（在 Dashboard 或以下指令）
-- ============================================================

-- 將資料表加入 Realtime Publication
-- （若 supabase_realtime publication 已存在則使用以下指令）
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ============================================================
-- 完成！
-- 接下來至 Supabase Dashboard → Database → Replication
-- 確認 messages 和 conversations 兩張表已勾選 Realtime
-- ============================================================
