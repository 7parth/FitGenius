import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { TrendingUp, Dumbbell, Clock, Flame, Calendar, Target } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, formatDuration } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const PERIODS = ['7d', '30d', '90d', '1y'] as const
const METRICS = [
  { key: 'volume', label: 'Volume (kg)', color: '#6366f1' },
  { key: 'duration', label: 'Duration (min)', color: '#22d3ee' },
  { key: 'calories', label: 'Calories', color: '#f59e0b' },
  { key: 'sessions', label: 'Sessions', color: '#10b981' },
] as const

type Period = typeof PERIODS[number]
type Metric = typeof METRICS[number]['key']

export default function ProgressPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [metric, setMetric] = useState<Metric>('volume')
  const currentYear = new Date().getFullYear()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/progress/summary').then(r => r.data),
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['progress-history', metric, period],
    queryFn: () => api.get('/progress/history', { params: { metric, period } }).then(r => r.data),
  })

  const { data: records } = useQuery({
    queryKey: ['personal-records'],
    queryFn: () => api.get('/progress/records').then(r => r.data),
  })

  const { data: calendar } = useQuery({
    queryKey: ['activity-calendar', currentYear],
    queryFn: () => api.get('/progress/activity-calendar', { params: { year: currentYear } }).then(r => r.data),
  })

  const chartData = (history?.data ?? []).map((p: any) => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: Math.round(p.value * 10) / 10,
  }))

  const currentMetric = METRICS.find(m => m.key === metric)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Progress</h1>
        <p className="text-gray-400 text-sm mt-1">Track your fitness journey over time</p>
      </div>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner /></div>
      ) : summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon={Calendar} label="Total Sessions" value={summary.total_sessions} />
          <SummaryCard icon={Clock} label="Total Time" value={`${Math.round(summary.total_duration_minutes / 60)}h`} />
          <SummaryCard icon={Dumbbell} label="Total Volume" value={`${Math.round(summary.total_volume_kg / 1000)}t`} />
          <SummaryCard icon={Flame} label="Streak" value={`${summary.current_streak_days}d`} color="text-amber-400" />
        </div>
      ) : null}

      {/* Chart */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  metric === m.key
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'bg-surface-700 text-gray-400 hover:text-white'
                )}
                aria-pressed={metric === m.key}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  period === p ? 'bg-surface-600 text-white' : 'text-gray-500 hover:text-gray-300'
                )}
                aria-pressed={period === p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No data for this period yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }}
                itemStyle={{ color: currentMetric.color }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={currentMetric.color}
                strokeWidth={2}
                fill="url(#gradient)"
                name={currentMetric.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Personal Records */}
      {records && records.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-400" aria-hidden="true" /> Personal Records
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {records.slice(0, 6).map((pr: any) => (
              <div key={pr.exercise_id} className="flex items-center justify-between p-3 rounded-xl bg-surface-700">
                <div>
                  <p className="text-sm font-medium text-white">{pr.exercise_name}</p>
                  <p className="text-xs text-gray-500">{new Date(pr.achieved_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  {pr.record_weight_kg && (
                    <p className="text-sm font-bold text-primary-400">{pr.record_weight_kg} kg</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Calendar */}
      {calendar && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">{currentYear} Activity</h2>
          <ActivityCalendar data={calendar.data} />
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color = 'text-primary-400' }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; color?: string
}) {
  return (
    <div className="card p-4">
      <Icon className={cn('w-5 h-5 mb-2', color)} aria-hidden="true" />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function ActivityCalendar({ data }: { data: Array<{ date: string; count: number; intensity: number }> }) {
  const INTENSITY_COLORS = [
    'bg-surface-700',
    'bg-primary-500/30',
    'bg-primary-500/50',
    'bg-primary-500/70',
    'bg-primary-500',
  ]

  // Build 52-week grid
  const dataMap = Object.fromEntries(data.map(d => [d.date, d]))
  const weeks: Array<Array<{ date: string; intensity: number; count: number } | null>> = []
  const now = new Date()
  const year = now.getFullYear()
  const start = new Date(year, 0, 1)
  // Align to Sunday
  const startDay = start.getDay()
  let cursor = new Date(start)
  cursor.setDate(cursor.getDate() - startDay)

  for (let w = 0; w < 53; w++) {
    const week: Array<{ date: string; intensity: number; count: number } | null> = []
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().split('T')[0]
      if (cursor.getFullYear() === year) {
        const entry = dataMap[dateStr]
        week.push({ date: dateStr, intensity: entry?.intensity ?? 0, count: entry?.count ?? 0 })
      } else {
        week.push(null)
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max" role="grid" aria-label="Activity calendar">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1" role="row">
            {week.map((day, di) => (
              <div
                key={di}
                role="gridcell"
                className={cn('w-3 h-3 rounded-sm', day ? INTENSITY_COLORS[day.intensity] : 'bg-transparent')}
                title={day ? `${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}` : undefined}
                aria-label={day ? `${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}` : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {INTENSITY_COLORS.map((c, i) => (
          <div key={i} className={cn('w-3 h-3 rounded-sm', c)} aria-hidden="true" />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
