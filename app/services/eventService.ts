import { add } from 'date-fns'
import type { Event } from '@/types'

/**
 * Model (資料存取層): 負責資料獲取與持久化處理
 */
export const eventService = {
  /**
   * 取得指定期間的活動列表
   */
  async fetchEvents(yearMonth?: string): Promise<Event[]> {
    // 透過 Mock 模擬向後端要求資料
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            date: new Date(),
            time: '09:00',
            period: 'AM',
            title: 'Morning Zen Meditation',
            icon: 'self_improvement',
            location: 'Activity Center Room 302',
            attendees: 15
          },
          {
            id: 2,
            date: new Date(),
            time: '12:30',
            period: 'PM',
            title: 'Mindful Lunch Meetup',
            icon: 'restaurant',
            location: 'Vegetarian Dining Hall',
            attendees: 8
          },
          {
            id: 3,
            date: add(new Date(), { days: 4 }),
            time: '18:00',
            period: 'PM',
            title: 'Evening Chanting',
            icon: 'mosque',
            location: 'Meditation Hall',
            attendees: 12
          }
        ])
      }, 300)
    })
  }
}
