import type { Database } from '@/types/database.types'
import type {
  ConversationItem,
  Message,
  CreateConversationParams,
  SendMessageParams
} from '@/types/messaging'

/**
 * 即時通訊資料層：負責與 Supabase 互動
 */
export const messagingService = {
  /**
   * 取得當前使用者的所有對話（含未讀數、最後一則訊息）
   */
  async fetchConversations(supabase: ReturnType<typeof useSupabaseClient<Database>>): Promise<ConversationItem[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 取得我參與的對話 id
    const { data: myMemberships, error: memberErr } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', user.id)

    if (memberErr) throw memberErr
    if (!myMemberships?.length) return []

    const conversationIds = myMemberships.map(m => m.conversation_id)
    const lastReadMap = new Map(myMemberships.map(m => [m.conversation_id, m.last_read_at]))

    // 取得對話基本資料
    const { data: conversations, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (convErr) throw convErr
    if (!conversations?.length) return []

    // 批次取得每個對話的最後一則訊息
    const { data: lastMessages, error: msgErr } = await supabase
      .from('messages')
      .select('conversation_id, content, sender_id, created_at, is_deleted')
      .in('conversation_id', conversationIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (msgErr) throw msgErr

    // 每個對話只保留最新一則訊息
    const lastMsgMap = new Map<string, typeof lastMessages[0]>()
    for (const msg of (lastMessages ?? [])) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, msg)
      }
    }

    // 批次取得未讀數：訊息 created_at > last_read_at 且不是自己發的
    const unreadCounts = new Map<string, number>()
    for (const convId of conversationIds) {
      const lastRead = lastReadMap.get(convId) ?? new Date(0).toISOString()
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .eq('is_deleted', false)
        .neq('sender_id', user.id)
        .gt('created_at', lastRead)

      unreadCounts.set(convId, count ?? 0)
    }

    // 取得群組訊息的發送者名稱（只取需要的 user_id）
    const senderIds = [...new Set(
      [...lastMsgMap.values()].map(m => m.sender_id).filter(Boolean)
    )]
    const senderNames = new Map<string, string>()
    if (senderIds.length) {
      const { data: profiles } = await supabase
        .from('members')
        .select('id, name')
        .in('id', senderIds)
      for (const p of (profiles ?? [])) {
        senderNames.set(p.id, p.name ?? p.id)
      }
    }

    return conversations.map(conv => {
      const lastMsg = lastMsgMap.get(conv.id)
      const isGroup = conv.is_group

      let lastMessageText = ''
      let lastMessageSender: string | null = null
      if (lastMsg) {
        lastMessageText = lastMsg.content
        if (isGroup && lastMsg.sender_id !== user.id) {
          lastMessageSender = senderNames.get(lastMsg.sender_id) ?? null
        }
      }

      return {
        id: conv.id,
        name: conv.name ?? '未命名對話',
        avatarUrl: conv.avatar_url,
        avatarIcon: isGroup ? 'groups' : null,
        isGroup,
        isOnline: false,  // 後續可透過 Presence 實作
        lastMessage: lastMessageText,
        lastMessageSender,
        updatedAt: conv.updated_at,
        unreadCount: unreadCounts.get(conv.id) ?? 0
      }
    })
  },

  /**
   * 取得某對話的訊息（最多 50 則，由舊至新）
   */
  async fetchMessages(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    conversationId: string,
    before?: string  // cursor: 早於此 created_at（用於分頁）
  ): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query
    if (error) throw error

    const messages = (data ?? []).reverse()

    // 取得發送者資料
    const senderIds = [...new Set(messages.map(m => m.sender_id))]
    const senderMap = new Map<string, { name: string; avatar: string | null }>()
    if (senderIds.length) {
      const { data: profiles } = await supabase
        .from('members')
        .select('id, name, avatar_url')
        .in('id', senderIds)
      for (const p of (profiles ?? [])) {
        senderMap.set(p.id, { name: p.name ?? p.id, avatar: p.avatar_url ?? null })
      }
    }

    return messages.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      senderName: senderMap.get(m.sender_id)?.name ?? '未知成員',
      senderAvatar: senderMap.get(m.sender_id)?.avatar ?? null,
      content: m.content,
      messageType: m.message_type as 'text' | 'image' | 'system',
      imageUrl: m.image_url,
      isDeleted: m.is_deleted,
      isMine: m.sender_id === user.id,
      createdAt: m.created_at
    }))
  },

  /**
   * 傳送訊息
   */
  async sendMessage(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    params: SendMessageParams
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase.from('messages').insert({
      conversation_id: params.conversationId,
      sender_id: user.id,
      content: params.content,
      message_type: params.messageType ?? 'text',
      image_url: params.imageUrl ?? null
    })

    if (error) throw error
  },

  /**
   * 建立新對話（私訊或群組）
   */
  async createConversation(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    params: CreateConversationParams
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 建立對話
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        name: params.name ?? null,
        is_group: params.isGroup ?? false,
        created_by: user.id
      })
      .select('id')
      .single()

    if (convErr) throw convErr

    // 加入所有成員（包含自己）
    const allMemberIds = [...new Set([user.id, ...params.memberIds])]
    const { error: memberErr } = await supabase
      .from('conversation_members')
      .insert(allMemberIds.map(uid => ({
        conversation_id: conv.id,
        user_id: uid
      })))

    if (memberErr) throw memberErr

    return conv.id
  },

  /**
   * 更新已讀時間（進入對話時呼叫）
   */
  async markAsRead(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    conversationId: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
  },

  /**
   * 軟刪除訊息
   */
  async deleteMessage(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    messageId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId)

    if (error) throw error
  },

  /**
   * 取得對話基本資訊（聊天室 header 用）
   */
  async fetchConversationInfo(
    supabase: ReturnType<typeof useSupabaseClient<Database>>,
    conversationId: string
  ): Promise<{ name: string; isGroup: boolean; avatarUrl: string | null; memberCount: number }> {
    const { data: conv, error } = await supabase
      .from('conversations')
      .select('name, is_group, avatar_url')
      .eq('id', conversationId)
      .single()

    if (error) throw error

    const { count } = await supabase
      .from('conversation_members')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    return {
      name: conv.name ?? '未命名對話',
      isGroup: conv.is_group,
      avatarUrl: conv.avatar_url,
      memberCount: count ?? 0
    }
  }
}
