import { messagingService } from '@/services/messagingService'
import type { ConversationItem } from '@/types/messaging'
import type { Database } from '@/types/database.types'

/**
 * 對話列表頁邏輯層
 * 管理對話列表狀態 + Realtime 訂閱（conversations 表更新）
 */
export function useMessaging() {
  const supabase = useSupabaseClient<Database>()

  const conversations = ref<ConversationItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadConversations = async () => {
    isLoading.value = true
    error.value = null
    try {
      conversations.value = await messagingService.fetchConversations(supabase)
    } catch (err: any) {
      error.value = err.message ?? '載入對話失敗'
      console.error('[useMessaging] loadConversations:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Realtime：conversations.updated_at 變動 → 重新拉列表（含未讀數）
  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

  const subscribeRealtime = () => {
    realtimeChannel = supabase
      .channel('messaging_list')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => { loadConversations() }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        () => { loadConversations() }
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
    await loadConversations()
    subscribeRealtime()
  })

  onUnmounted(() => {
    unsubscribeRealtime()
  })

  return {
    conversations,
    isLoading,
    error,
    loadConversations
  }
}
