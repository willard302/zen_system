import type { Database } from '@/types/database.types'
import type { MeditationPeriod, MeditationSession, MeditationStats, ChartDataPoint } from '@/types'

type SessionRow = Database['public']['Tables']['meditation_sessions']['Row']

// ---------- helpers ----------

function rowToSession(row: SessionRow): MeditationSession {
  return {
    id: row.id,
    userId: row.user_id,
    startedAt: row.started_at,
    durationSeconds: row.duration_seconds,
    targetSeconds: row.target_seconds,
    completed: row.completed,
    meditationType: row.meditation_type,
    note: row.note,
    createdAt: row.created_at
  }
}

function getDateRange(period: MeditationPeriod, ref = new Date()): { from: Date; to: Date } {
  const from = new Date(ref)
  const to = new Date(ref)

  if (period === 'Day') {
    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)
  } else if (period === 'Week') {
    const dayOfWeek = from.getDay()                     // 0 = Sun
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    from.setDate(from.getDate() + diffToMonday)
    from.setHours(0, 0, 0, 0)
    to.setTime(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  } else if (period === 'Month') {
    from.setDate(1)
    from.setHours(0, 0, 0, 0)
    to.setMonth(to.getMonth() + 1, 0)
    to.setHours(23, 59, 59, 999)
  } else {
    from.setMonth(0, 1)
    from.setHours(0, 0, 0, 0)
    to.setMonth(11, 31)
    to.setHours(23, 59, 59, 999)
  }
  return { from, to }
}

function getPriorRange(period: MeditationPeriod, current: { from: Date; to: Date }): { from: Date; to: Date } {
  const duration = current.to.getTime() - current.from.getTime() + 1
  return {
    from: new Date(current.from.getTime() - duration),
    to: new Date(current.to.getTime() - duration)
  }
}

function buildChartData(
  sessions: SessionRow[],
  period: MeditationPeriod,
  range: { from: Date; to: Date }
): ChartDataPoint[] {
  if (period === 'Day') {
    const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']
    const buckets: Record<string, number> = Object.fromEntries(labels.map(l => [l, 0]))
    for (const s of sessions) {
      const hour = new Date(s.started_at).getHours()
      const label = `${String(Math.floor(hour / 4) * 4).padStart(2, '0')}:00`
      buckets[label] = (buckets[label] ?? 0) + s.duration_seconds / 60
    }
    return labels.map(l => ({ label: l, value: Math.round(buckets[l]) }))
  }

  if (period === 'Week') {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const buckets: Record<string, number> = Object.fromEntries(dayLabels.map(l => [l, 0]))
    for (const s of sessions) {
      const d = new Date(s.started_at).getDay()         // 0 = Sun
      const label = dayLabels[d === 0 ? 6 : d - 1]
      buckets[label] = (buckets[label] ?? 0) + s.duration_seconds / 60
    }
    return dayLabels.map(l => ({ label: l, value: Math.round(buckets[l]) }))
  }

  if (period === 'Month') {
    const daysInMonth = new Date(range.to.getFullYear(), range.to.getMonth() + 1, 0).getDate()
    const numWeeks = Math.ceil(daysInMonth / 7)
    const buckets: number[] = Array(numWeeks).fill(0)
    for (const s of sessions) {
      const day = new Date(s.started_at).getDate()
      const idx = Math.min(Math.ceil(day / 7) - 1, numWeeks - 1)
      buckets[idx] += s.duration_seconds / 60
    }
    return buckets.map((v, i) => ({ label: `Week ${i + 1}`, value: Math.round(v) }))
  }

  // Year
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const buckets: Record<string, number> = Object.fromEntries(monthLabels.map(l => [l, 0]))
  for (const s of sessions) {
    const label = monthLabels[new Date(s.started_at).getMonth()]
    buckets[label] = (buckets[label] ?? 0) + s.duration_seconds / 60
  }
  return monthLabels.map(l => ({ label: l, value: Math.round(buckets[l]) }))
}

// ---------- service ----------

export const meditationService = {
  async saveSession(params: {
    startedAt: Date
    durationSeconds: number
    targetSeconds: number
    completed: boolean
    meditationType: string
  }): Promise<void> {
    const supabase = useSupabaseClient<Database>()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('meditation_sessions').insert({
      user_id: user.id,
      started_at: params.startedAt.toISOString(),
      duration_seconds: params.durationSeconds,
      target_seconds: params.targetSeconds,
      completed: params.completed,
      meditation_type: params.meditationType
    })

    if (error) throw new Error(error.message)
  },

  async fetchStats(period: MeditationPeriod): Promise<MeditationStats> {
    const supabase = useSupabaseClient<Database>()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalMinutes: 0, trend: 0, chartData: [] }

    const currentRange = getDateRange(period)
    const priorRange = getPriorRange(period, currentRange)

    const [currentResult, priorResult] = await Promise.all([
      supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', currentRange.from.toISOString())
        .lte('started_at', currentRange.to.toISOString()),
      supabase
        .from('meditation_sessions')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('started_at', priorRange.from.toISOString())
        .lte('started_at', priorRange.to.toISOString())
    ])

    const currentSessions = currentResult.data ?? []
    const priorSessions = priorResult.data ?? []

    const currentTotal = currentSessions.reduce((sum, s) => sum + s.duration_seconds, 0)
    const priorTotal = (priorSessions as { duration_seconds: number }[]).reduce(
      (sum, s) => sum + s.duration_seconds,
      0
    )

    const trend =
      priorTotal === 0
        ? currentTotal > 0 ? 100 : 0
        : Math.round(((currentTotal - priorTotal) / priorTotal) * 100)

    return {
      totalMinutes: Math.round(currentTotal / 60),
      trend,
      chartData: buildChartData(currentSessions, period, currentRange)
    }
  },

  async fetchRecentSessions(limit = 5): Promise<MeditationSession[]> {
    const supabase = useSupabaseClient<Database>()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('meditation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return (data ?? []).map(rowToSession)
  }
}
