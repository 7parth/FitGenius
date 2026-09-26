import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { api, nutritionApi } from '@/lib/api'

type Recommendation = {
  id: string
  stage: string
  confidence_score: number
  payload: {
    exercises?: Array<{ exercise_id: string; name: string; sets: number; reps?: number; duration_seconds?: number; supports_pose_analysis?: boolean }>
    rationale?: string
    estimated_duration_minutes?: number
    adjustments?: { fatigue_level?: string }
  }
}

type DailyPoint = { date: string; value: number }

const percent = (amount: number, target: number) => target > 0 ? Math.min(100, Math.round(amount / target * 100)) : 0
const display = (value?: number | null, suffix = '') => value == null ? '—' : `${value}${suffix}`

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const summary = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/progress/summary').then(response => response.data),
  })
  const recommendation = useQuery<Recommendation | null>({
    queryKey: ['recommendation-latest'],
    queryFn: () => api.get('/recommendations/latest').then(response => response.data).catch(error => {
      if (error?.response?.status === 404) return null
      throw error
    }),
  })
  const nutrition = useQuery({ queryKey: ['nutrition-today'], queryFn: () => nutritionApi.getTodaySummary() })
  const gamification = useQuery({ queryKey: ['gamification-summary'], queryFn: () => api.get('/gamification/summary').then(response => response.data) })
  const wearable = useQuery({ queryKey: ['wearable-data', 'dashboard'], queryFn: () => api.get('/wearables/data?page=1&page_size=1').then(response => response.data[0] ?? null) })
  const fatigue = useQuery({ queryKey: ['wearable-fatigue'], queryFn: () => api.get('/wearables/fatigue').then(response => response.data) })
  const weeklyHistory = useQuery({
    queryKey: ['dashboard-weekly-history'],
    queryFn: () => api.get('/progress/history?metric=duration&period=7d').then(response => response.data.data as DailyPoint[]),
  })

  const generateRecommendation = useMutation({
    mutationFn: () => api.post('/recommendations/generate', { context_override: null }).then(response => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recommendation-latest'] }),
  })

  const days = useMemo(() => {
    const data = new Map((weeklyHistory.data ?? []).map(point => [point.date, point.value]))
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setUTCHours(0, 0, 0, 0)
      date.setUTCDate(date.getUTCDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), minutes: data.get(key) ?? 0, today: index === 6 }
    })
  }, [weeklyHistory.data])
  const weeklyMinutes = days.reduce((total, day) => total + day.minutes, 0)
  const maxDay = Math.max(60, ...days.map(day => day.minutes))
  const plan = recommendation.data?.payload
  const exercises = plan?.exercises ?? []
  const calorieGoal = nutrition.data?.goal?.target_calories ?? 0
  const calories = nutrition.data?.total_calories ?? 0
  const macros = [
    { name: 'Protein', current: nutrition.data?.total_protein_g ?? 0, target: nutrition.data?.goal?.target_protein_g ?? 0, color: 'bg-primary-container', text: 'text-primary-container' },
    { name: 'Carbohydrates', current: nutrition.data?.total_carbs_g ?? 0, target: nutrition.data?.goal?.target_carbs_g ?? 0, color: 'bg-secondary', text: 'text-secondary' },
    { name: 'Fats', current: nutrition.data?.total_fat_g ?? 0, target: nutrition.data?.goal?.target_fat_g ?? 0, color: 'bg-tertiary-fixed-dim', text: 'text-tertiary-fixed-dim' },
  ]
  const loading = summary.isLoading || nutrition.isLoading || gamification.isLoading
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-6 lg:px-8">
    <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-on-surface-variant"><span className="rounded-full bg-surface-container-high px-3 py-1 text-primary">FitGenius dashboard</span><span>{today}</span>{wearable.data && <span>Wearable synced {new Date(wearable.data.recorded_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-on-surface">Welcome back, {user?.display_name || 'athlete'}!</h1>
        <p className="mt-2 max-w-2xl text-on-surface-variant">Your workouts, recovery, and nutrition at a glance. Dashboard metrics are based on your saved activity and connected wearable data.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => navigate('/workout/recommend')} className="rounded-xl bg-primary-container px-5 py-3 font-bold text-on-primary-container">+ Log Workout</button>
        <button type="button" onClick={() => navigate('/progress')} className="rounded-xl bg-surface-container-high px-5 py-3 font-semibold text-on-surface">View Progress</button>
      </div>
    </header>

    {loading && <div role="status" className="rounded-xl bg-surface-container-low p-4 text-on-surface-variant">Loading your dashboard…</div>}

    <section aria-label="Workout and recovery summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Workouts this week" value={display(summary.data?.sessions_this_week)} detail={`${display(summary.data?.total_sessions)} completed overall`} icon="fitness_center" />
      <Stat label="Weekly training time" value={weeklyHistory.isLoading ? '…' : `${Math.round(weeklyMinutes)} min`} detail={`${display(summary.data?.current_streak_days ?? gamification.data?.current_streak_days, ' day streak')}`} icon="timer" />
      <Stat label="Bio-readiness" value={wearable.data?.recovery_score == null ? 'No wearable data' : `${wearable.data.recovery_score}/100`} detail={fatigue.data?.fatigue_level ? `${fatigue.data.fatigue_level} recovery` : 'Connect a wearable to see recovery'} icon="ecg_heart" />
      <Stat label="HRV baseline" value={display(wearable.data?.hrv_ms, ' ms')} detail={`Resting HR ${display(wearable.data?.resting_heart_rate, ' bpm')}`} icon="vital_signs" />
    </section>

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]">
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-lg md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Personalized workout</p><h2 className="mt-1 text-2xl font-bold text-on-surface">{exercises.length ? 'Your recommended session' : 'Get your workout recommendation'}</h2></div>
            <button type="button" disabled={generateRecommendation.isPending} onClick={() => generateRecommendation.mutate()} className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-50">{generateRecommendation.isPending ? 'Generating…' : exercises.length ? 'Refresh plan' : 'Generate plan'}</button>
          </div>
          {recommendation.isError && <p role="alert" className="mt-3 text-sm text-error">Could not load your recommendation. Try refreshing.</p>}
          {generateRecommendation.isError && <p role="alert" className="mt-3 text-sm text-error">Could not generate a plan. Please try again.</p>}
          {plan?.rationale && <p className="mt-3 text-sm text-on-surface-variant">{plan.rationale}</p>}
          {exercises.length > 0 ? <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat label="Duration" value={display(plan?.estimated_duration_minutes, ' min')} detail="Personalized target" icon="schedule" compact /><Stat label="Exercises" value={String(exercises.length)} detail="In this plan" icon="reorder" compact /><Stat label="Plan confidence" value={`${Math.round((recommendation.data?.confidence_score ?? 0) * 100)}%`} detail={recommendation.data?.stage?.replace(/_/g, ' ') ?? 'Recommendation engine'} icon="auto_awesome" compact /></div>
            <ul className="mt-5 divide-y divide-outline-variant/30">{exercises.slice(0, 4).map(item => <li key={item.exercise_id} className="flex items-center justify-between gap-4 py-3"><span className="font-medium text-on-surface">{item.name}{item.supports_pose_analysis && <span className="ml-2 rounded bg-primary-container/15 px-2 py-0.5 text-xs text-primary">Pose tracking</span>}</span><span className="shrink-0 text-sm text-on-surface-variant">{item.sets} sets{item.reps ? ` × ${item.reps} reps` : ''}</span></li>)}</ul>
          </> : !recommendation.isLoading && <p className="mt-4 text-sm text-on-surface-variant">Generate a personalized session based on your workout history and recovery data.</p>}
          <button type="button" onClick={() => navigate('/workout/recommend')} className="mt-5 w-full rounded-xl bg-primary-container px-5 py-3 font-bold text-on-primary-container">Open workout planner <span aria-hidden="true">→</span></button>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-md md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Last 7 days</p><h2 className="mt-1 text-xl font-bold text-on-surface">Weekly cadence</h2><p className="text-sm text-on-surface-variant">{Math.round(weeklyMinutes)} minutes of completed workouts</p></div><span className="rounded-full bg-secondary-container/20 px-3 py-1 text-sm font-semibold text-secondary">{gamification.data?.current_streak_days ?? 0} day streak</span></div>
          {weeklyHistory.isError ? <p role="alert" className="mt-5 text-sm text-error">Weekly activity could not be loaded.</p> : <div className="mt-5 grid grid-cols-7 items-end gap-2" aria-label="Daily workout minutes for the last seven days">{days.map(day => <div key={day.key} className="flex flex-col items-center gap-2"><span className="text-xs text-on-surface-variant">{day.minutes ? `${Math.round(day.minutes)}m` : ''}</span><div className={`flex h-28 w-full items-end rounded-lg p-1 ${day.today ? 'bg-primary-container/15' : 'bg-surface-container-high'}`}><div title={`${day.label}: ${Math.round(day.minutes)} workout minutes`} className={`w-full rounded-md ${day.today ? 'bg-primary-container' : 'bg-secondary/70'}`} style={{ height: `${day.minutes ? Math.max(8, day.minutes / maxDay * 100) : 0}%` }} /></div><span className={`text-xs ${day.today ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>{day.label}</span></div>)}</div>}
          <button type="button" onClick={() => navigate('/progress')} className="mt-4 text-sm font-semibold text-primary underline">Explore workout analytics</button>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-md md:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-tertiary">Recovery insight</p><h2 className="mt-1 text-xl font-bold text-on-surface">Today’s training guidance</h2></div><span className="material-symbols-outlined text-tertiary">psychology</span></div>
          <p className="mt-3 text-on-surface-variant">{fatigue.data?.recommendation_note ?? 'Add wearable data to receive recovery-aware training guidance.'}</p>
          {fatigue.data?.disclaimer && <p className="mt-2 text-xs text-on-surface-variant">{fatigue.data.disclaimer}</p>}
          <button type="button" onClick={() => navigate('/coach')} className="mt-4 rounded-lg bg-tertiary-container/20 px-4 py-2 font-semibold text-tertiary">Ask your AI coach</button>
        </section>
      </div>

      <aside className="flex flex-col gap-6">
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-md">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Metabolic fueling</p><h2 className="mt-1 text-xl font-bold text-on-surface">Nutrition today</h2></div><span className="material-symbols-outlined text-primary">restaurant</span></div>
          {nutrition.isError ? <p role="alert" className="mt-4 text-sm text-error">Nutrition summary is unavailable.</p> : <>
            <div className="mt-5 flex items-center gap-5"><div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#00f0ff ${percent(calories, calorieGoal)}%, #30343d 0)` }}><div className="grid h-[70px] w-[70px] place-items-center rounded-full bg-surface-container-low text-center"><span className="text-sm font-bold text-on-surface">{calories}<small className="block text-xs font-normal text-on-surface-variant">kcal</small></span></div></div><div><p className="text-sm text-on-surface-variant">Daily calorie target</p><p className="text-xl font-bold text-on-surface">{calorieGoal || '—'} kcal</p><p className="mt-1 text-sm text-secondary">{calorieGoal ? `${Math.max(0, calorieGoal - calories)} kcal remaining` : 'Set your nutrition goal'}</p></div></div>
            <div className="mt-5 flex flex-col gap-4">{macros.map(macro => <div key={macro.name}><div className="flex justify-between text-sm"><span className="text-on-surface">{macro.name}</span><span className="text-on-surface-variant">{Math.round(macro.current)} / {macro.target || '—'} g</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-container-high"><div className={`h-full rounded-full ${macro.color}`} style={{ width: `${percent(macro.current, macro.target)}%` }} /></div></div>)}</div>
          </>}
          <button type="button" onClick={() => navigate('/nutrition')} className="mt-5 w-full rounded-xl bg-surface-container-high px-4 py-3 font-semibold text-on-surface">Open nutrition planner</button>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-md">
          <div className="flex items-center gap-3"><span className="material-symbols-outlined text-2xl text-primary">videocam</span><div><h2 className="font-bold text-on-surface">Pose Tracker</h2><p className="text-sm text-on-surface-variant">Live exercise form and rep tracking</p></div></div>
          <button type="button" onClick={() => navigate('/workout/pose')} className="mt-4 w-full rounded-xl bg-primary-container/15 px-4 py-3 font-semibold text-primary">Open Pose Tracker</button>
        </section>

        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-md">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Your milestones</p><h2 className="mt-1 text-xl font-bold text-on-surface">Training progress</h2></div><span className="material-symbols-outlined text-secondary">emoji_events</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-surface-container p-3"><p className="text-xs text-on-surface-variant">Total points</p><p className="mt-1 text-xl font-bold text-primary">{gamification.data?.total_points ?? 0}</p></div><div className="rounded-lg bg-surface-container p-3"><p className="text-xs text-on-surface-variant">Level</p><p className="mt-1 text-xl font-bold text-secondary">{gamification.data?.level ?? 1}</p></div></div>
          <button type="button" onClick={() => navigate('/achievements')} className="mt-4 text-sm font-semibold text-primary underline">View achievements</button>
        </section>
      </aside>
    </div>

    {(summary.isError || gamification.isError || wearable.isError || fatigue.isError) && <p role="status" className="text-sm text-on-surface-variant">Some dashboard data could not be loaded. Refresh the page or check your connection.</p>}
  </main>
}

function Stat({ label, value, detail, icon, compact = false }: { label: string; value: string; detail: string; icon: string; compact?: boolean }) {
  return <div className={`rounded-xl bg-surface-container ${compact ? 'p-3' : 'p-4'}`}><div className="flex items-center gap-2 text-on-surface-variant"><span className="material-symbols-outlined text-lg text-primary">{icon}</span><span className="text-xs uppercase tracking-wide">{label}</span></div><p className={`mt-2 font-bold text-on-surface ${compact ? 'text-lg' : 'text-2xl'}`}>{value}</p><p className="mt-1 text-xs text-on-surface-variant">{detail}</p></div>
}
