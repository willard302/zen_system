import type { UserProfile, Activity } from '@/types'

/**
 * 使用者相關的 API 服務，負責網路請求 (Data Layer)
 */
export const userService = {
  /**
   * 取得使用者詳細資料
   */
  async fetchUserProfile(): Promise<UserProfile> {
    // 這裡通常會使用 $fetch 呼叫後端 API
    // return await $fetch('/api/user/profile')

    // 暫時使用 Mock 資料模擬網路請求
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          name: 'User Name',
          role: 'Club Member',
          joinDate: 'Since 2024',
          totalMeditation: '12.5h',
          monthlyCheckIns: '8次',
          department: 'Department Name',
          studentId: '410012345'
        })
      }, 300)
    })
  },

  /**
   * 取得使用者的近期活動
   */
  async fetchRecentActivities(): Promise<Activity[]> {
    // 這裡通常會使用 $fetch 呼叫後端 API
    // return await $fetch('/api/user/activities')

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            type: 'meditation',
            date: 'Today',
            title: 'Morning Meditation',
            duration: '30 mins',
            icon: 'self_improvement'
          },
          {
            type: 'event',
            date: 'Yesterday',
            title: 'Weekly Gathering',
            duration: '1 hour',
            icon: 'groups'
          },
          {
            type: 'meditation',
            date: 'Mar 28',
            title: 'Evening Session',
            duration: '45 mins',
            icon: 'self_improvement'
          }
        ])
      }, 300)
    })
  }
}
