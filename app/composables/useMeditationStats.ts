import { ref, watch } from 'vue'
import { meditationService } from '@/services/meditationService'
import type { MeditationPeriod, MeditationStats, MeditationSession } from '@/types'

export function useMeditationStats() {
  const selectedPeriod = ref<MeditationPeriod>('Week')
  const stats = ref<MeditationStats | null>(null)
  const recentSessions = ref<MeditationSession[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadStats = async () => {
    isLoading.value = true
    error.value = null
    try {
      const [statsData, sessionsData] = await Promise.all([
        meditationService.fetchStats(selectedPeriod.value),
        meditationService.fetchRecentSessions(5)
      ])
      stats.value = statsData
      recentSessions.value = sessionsData
    } catch (err: any) {
      error.value = err.message || '載入統計資料失敗'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  watch(selectedPeriod, loadStats)

  return {
    selectedPeriod,
    stats,
    recentSessions,
    isLoading,
    error,
    loadStats
  }
}
