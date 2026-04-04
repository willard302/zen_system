import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userService } from '@/services/userService'
import type { UserProfile, Activity } from '@/types'

/**
 * Logic Layer: 使用者的業務邏輯與狀態管理
 */
export function useUser() {
  const router = useRouter()
  
  // 狀態 (State)
  const userProfile = ref<UserProfile | null>(null)
  const recentActivities = ref<Activity[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 動作 (Actions)
  const loadUserData = async () => {
    isLoading.value = true
    error.value = null
    try {
      // 呼叫 Data Layer (這兩支可以放 Promise.all 提升效能)
      const [profileData, activitiesData] = await Promise.all([
        userService.fetchUserProfile(),
        userService.fetchRecentActivities()
      ])
      
      userProfile.value = profileData
      recentActivities.value = activitiesData
    } catch (err: any) {
      error.value = err.message || 'Failed to load user data'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  const handleLogout = () => {
    // 這裡可以處理清除 Token 等邏輯
    // ...
    
    // 跳轉回登入頁
    router.push('/auth/login')
  }

  return {
    userProfile,
    recentActivities,
    isLoading,
    error,
    loadUserData,
    handleLogout
  }
}
