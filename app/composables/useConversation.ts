import { messagingService } from '@/services/messagingService'
import type { Message, DbMessage } from '@/types/messaging'
import type { Database } from '@/types/database.types'

/**
 * 聊天室頁邏輯層
 * 管理訊息列表狀態 + Realtime 訂閱（messages INSERT）
 */
export function useConversation(conversationId: string) {
  const supabase = useSupabaseClient<Database>()

  const messages = ref<Message[]>([])
  const conversationName = ref('')
  const isGroup = ref(false)
  const memberCount = ref(0)
  const avatarUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const isSending = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)   // 是否還有更早的訊息可載入
  let currentUserId: string | null = null

  // ── 載入訊息 ────────────────────────────────────────────────

  const loadMessages = async () => {
    isLoading.value = true
    error.value = null
    try {
      messages.value = await messagingService.fetchMessages(supabase, conversationId)
      if (messages.value.length < 50) hasMore.value = false
    } catch (err: any) {
      error.value = err.message ?? '載入訊息失敗'
      console.error('[useConversation] loadMessages:', err)
    } finally {
      isLoading.value = false
    }
  }

  // ── 載入更早的訊息（上滑分頁）──────────────────────────────

  const loadMore = async () => {
    if (!hasMore.value || isLoading.value) return
    const oldest = messages.value[0]?.createdAt
    if (!oldest) return

    isLoading.value = true
    try {
      const older = await messagingService.fetchMessages(supabase, conversationId, oldest)
      if (older.length < 50) hasMore.value = false
      messages.value = [...older, ...messages.value]
    } catch (err: any) {
      error.value = err.message ?? '載入更多訊息失敗'
    } finally {
      isLoading.value = false
    }
  }

  // ── 載入對話資訊 ─────────────────────────────────────────────

  const loadConversationInfo = async () => {
    try {
      const info = await messagingService.fetchConversationInfo(supabase, conversationId)
      conversationName.value = info.name
      isGroup.value = info.isGroup
      memberCount.value = info.memberCount
      avatarUrl.value = info.avatarUrl
    } catch (err: any) {
      console.error('[useConversation] loadConversationInfo:', err)
    }
  }

  // ── 傳送訊息 ─────────────────────────────────────────────────

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending.value) return
    isSending.value = true
    try {
      await messagingService.sendMessage(supabase, {
        conversationId,
        content: content.trim()
      })
    } catch (err: any) {
      error.value = err.message ?? '傳送失敗'
      console.error('[useConversation] sendMessage:', err)
    } finally {
      isSending.value = false
    }
  }

  // ── 軟刪除訊息 ───────────────────────────────────────────────

  const deleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(supabase, messageId)
      const idx = messages.value.findIndex(m => m.id === messageId)
      if (idx !== -1) messages.value[idx].isDeleted = true
    } catch (err: any) {
      error.value = err.message ?? '刪除失敗'
    }
  }

  // ── Realtime 訂閱 ─────────────────────────────────────────────

  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

  const subscribeRealtime = () => {
    realtimeChannel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const raw = payload.new as DbMessage

          // 取得 sender 資料
          const { data: profile } = await supabase
            .from('members')
            .select('id, name, avatar_url')
            .eq('id', raw.sender_id)
            .single()

          const newMsg: Message = {
            id: raw.id,
            conversationId: raw.conversation_id,
            senderId: raw.sender_id,
            senderName: profile?.name ?? '未知成員',
            senderAvatar: profile?.avatar_url ?? null,
            content: raw.content,
            messageType: raw.message_type as 'text' | 'image' | 'system',
            imageUrl: raw.image_url,
            isDeleted: raw.is_deleted,
            isMine: raw.sender_id === currentUserId,
            createdAt: raw.created_at
          }

          // 避免重複推入（自己傳送時 service 已加入）
          if (!messages.value.some(m => m.id === newMsg.id)) {
            messages.value.push(newMsg)
          }

          // 更新已讀
          await messagingService.markAsRead(supabase, conversationId)
        }
      )
      .subscribe()
  }

  const unsubscribeRealtime = () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
      realtimeChannel = null
    }
  }

  onMounted(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user?.id ?? null
    await Promise.all([loadConversationInfo(), loadMessages()])
    await messagingService.markAsRead(supabase, conversationId)
    subscribeRealtime()
  })

  onUnmounted(() => {
    unsubscribeRealtime()
  })

  return {
    messages,
    conversationName,
    isGroup,
    memberCount,
    avatarUrl,
    isLoading,
    isSending,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    loadMore
  }
}
