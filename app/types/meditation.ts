export type MeditationPeriod = 'Day' | 'Week' | 'Month' | 'Year'

export interface MeditationSession {
  id: string
  userId: string
  startedAt: string
  durationSeconds: number
  targetSeconds: number
  completed: boolean
  meditationType: string | null
  note: string | null
  createdAt: string
}

export interface ChartDataPoint {
  label: string
  value: number   // 單位：分鐘
}

export interface MeditationStats {
  totalMinutes: number
  trend: number           // 與上一期相比的百分比變化（正數=上升）
  chartData: ChartDataPoint[]
}
