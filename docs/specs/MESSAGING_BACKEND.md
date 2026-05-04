# 即時通訊後端設計文件

## 架構概覽

```
Client (Vue + Supabase SDK)
  │
  ├── REST API  ──→  PostgreSQL  (讀取歷史訊息、建立對話)
  └── Realtime  ──→  PostgreSQL LISTEN/NOTIFY  (即時推送新訊息)
```

Supabase Realtime 底層為 WebSocket，SDK 已封裝，前端不需自行管理連線。

---

## 資料表設計

### `conversations` — 對話（私訊 / 群組）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `uuid` PK | |
| `name` | `text` | 群組名稱（私訊時可為 null） |
| `is_group` | `boolean` | `false` = 私訊，`true` = 群組 |
| `avatar_url` | `text` | 群組大頭貼（可選） |
| `created_by` | `uuid` FK → `auth.users` | 建立者 |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | 最後有新訊息的時間（用於排序） |

### `conversation_members` — 對話成員

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` FK → `conversations` | |
| `user_id` | `uuid` FK → `auth.users` | |
| `joined_at` | `timestamptz` | |
| `last_read_at` | `timestamptz` | 用於計算未讀數 |

### `messages` — 訊息

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | `uuid` PK | |
| `conversation_id` | `uuid` FK → `conversations` | |
| `sender_id` | `uuid` FK → `auth.users` | |
| `content` | `text` | 訊息內容 |
| `message_type` | `text` | `text` / `image` / `system` |
| `image_url` | `text` | 圖片訊息用（可選） |
| `is_deleted` | `boolean` | 軟刪除 |
| `created_at` | `timestamptz` | |

---

## RLS 權限設計

| 操作 | 規則 |
|------|------|
| 讀取對話 | 只有對話成員可讀 |
| 建立對話 | 所有已登入成員可建 |
| 讀取訊息 | 只有對話成員可讀 |
| 發送訊息 | 只有對話成員可發 |
| 刪除訊息 | 只有訊息本人可軟刪除 |

---

## Migration SQL

> 完整 SQL 存放於 `supabase/migrations/20260504_messaging.sql`

---

## Realtime 訂閱設定（前端範例）

```ts
// composables/useMessaging.ts

const supabase = useSupabaseClient()

// 訂閱特定對話的新訊息
const subscribeToMessages = (conversationId: string, onNew: (msg: any) => void) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => onNew(payload.new)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// 訂閱對話列表的更新（新訊息後 updated_at 變動）
const subscribeToConversations = (onUpdate: () => void) => {
  const channel = supabase
    .channel('my_conversations')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations'
      },
      onUpdate
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
```

---

## 未讀數計算邏輯

```sql
-- 某對話的未讀訊息數
SELECT COUNT(*)
FROM messages m
JOIN conversation_members cm
  ON cm.conversation_id = m.conversation_id
  AND cm.user_id = auth.uid()
WHERE m.conversation_id = '<conversation_id>'
  AND m.created_at > cm.last_read_at
  AND m.sender_id != auth.uid();
```

前端讀取對話時，呼叫以下 SQL 更新 `last_read_at`：

```sql
UPDATE conversation_members
SET last_read_at = NOW()
WHERE conversation_id = '<conversation_id>'
  AND user_id = auth.uid();
```
