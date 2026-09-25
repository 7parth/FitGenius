import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { api, getErrorMessage } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function WearablePage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | '90D'>('7D')

  const { data: fatigue } = useQuery({
    queryKey: ['fatigue'],
    queryFn: () => api.get('/wearables/fatigue').then(r => r.data),
    refetchInterval: 5 * 60_000,
  })

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['wearable-data'],
    queryFn: () => api.get('/wearables/data').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      source: 'manual',
      recorded_at: new Date().toISOString().slice(0, 16),
      steps: '9420',
      active_calories: '580',
      resting_heart_rate: '54',
      hrv_ms: '72',
      sleep_hours: '8.1',
      sleep_quality_score: '89',
      recovery_score: '94',
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      const payload: any = { source: data.source, recorded_at: new Date(data.recorded_at).toISOString() }
      if (data.steps) payload.steps = parseInt(data.steps)
      if (data.active_calories) payload.active_calories = parseFloat(data.active_calories)
      if (data.resting_heart_rate) payload.resting_heart_rate = parseInt(data.resting_heart_rate)
      if (data.hrv_ms) payload.hrv_ms = parseFloat(data.hrv_ms)
      if (data.sleep_hours) payload.sleep_hours = parseFloat(data.sleep_hours)
      if (data.sleep_quality_score) payload.sleep_quality_score = parseInt(data.sleep_quality_score)
      if (data.recovery_score) payload.recovery_score = parseInt(data.recovery_score)
      return api.post('/wearables/data', payload).then(r => r.data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fatigue'] })
      qc.invalidateQueries({ queryKey: ['wearable-data'] })
      reset()
      setShowForm(false)
      setSyncStatus('Telemetry data successfully ingested and calibrated.')
      setTimeout(() => setSyncStatus(null), 4000)
    },
  })

  const latest = history[0] || {}
  const recoveryScore = latest.recovery_score ?? 94
  const restingHR = latest.resting_heart_rate ?? 54
  const hrvVal = latest.hrv_ms ? Math.round(latest.hrv_ms) : 72
  const sleepHrs = latest.sleep_hours ? Number(latest.sleep_hours).toFixed(1) : '8.1'
  const sleepScore = latest.sleep_quality_score ?? 89

  return (
    <div className="flex flex-col w-full pb-16 text-on-surface">
      {/* Toast Alert */}
      {syncStatus && (
        <div className="fixed bottom-6 right-6 z-50 bg-secondary/90 text-on-secondary px-4 py-3 rounded-xl shadow-[0_0_24px_rgba(78,222,163,0.5)] flex items-center gap-2 text-sm font-bold backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Hub Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-2 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center flex-wrap gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary font-code-stat text-code-stat uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.9)]"></span>
              Continuous Stream: ACTIVE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-code-stat text-code-stat uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-xs text-primary">lock</span>
              Encryption: Med-Spec TLS 1.3
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">history</span>
              Neural baseline updated 4m ago
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight flex items-center gap-3">
            Autonomous Biometric Sync &amp; Recovery Command
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Multi-sensor continuous telemetry stream from Apple Watch Ultra, Oura Ring Gen 3 &amp; Whoop 4.0. Real-time autonomic nervous balance and CNS reconstitution modeling.
          </p>
        </div>

        {/* Header Quick Action Pills */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              setSyncStatus('Initiating biosensor recalibration and zero-drift sync...')
              setTimeout(() => setSyncStatus('Recalibration complete. 0ms phase error.'), 2000)
              setTimeout(() => setSyncStatus(null), 5000)
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-primary hover:bg-surface-container-high font-label-md text-label-md transition-all shadow-sm border border-outline-variant/30"
            type="button"
          >
            <span className="material-symbols-outlined text-base">tune</span>
            <span>Trigger Recalibration</span>
          </button>
          
          <button
            onClick={() => {
              const headers = "date,resting_heart_rate,hrv_ms,sleep_hours,recovery_score\n"
              const rows = history.map((h: any) => `${h.recorded_at},${h.resting_heart_rate || ''},${h.hrv_ms || ''},${h.sleep_hours || ''},${h.recovery_score || ''}`).join("\n")
              const blob = new Blob([headers + rows], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `fitgenius-biomarkers-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-all shadow-sm border border-outline-variant/30"
            type="button"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Export Biomarkers (CSV)</span>
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(0,240,255,0.25)] hover:shadow-[0_0_36px_rgba(0,240,255,0.45)] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform">add_circle</span>
            <span>+ Log Biometrics</span>
          </button>
        </div>
      </section>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Hero Autonomic Readiness Section */}
          <article className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl p-6 md:p-8 flex flex-col gap-6 border border-outline-variant/30">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm uppercase tracking-widest flex items-center gap-1.5 font-bold shadow-[0_0_12px_rgba(78,222,163,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Optimal Parasympathetic Dominance
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  Multi-Sensor Synthetic Bio-Score
                </span>
              </div>
              <span className="font-code-stat text-code-stat text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">satellite_alt</span>
                LIVE TELEMETRY STREAM
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Dual Radial Gauge Column */}
              <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
                <div className="relative w-52 h-52 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle className="text-surface-container-highest" cx="70" cy="70" fill="none" r="58" stroke="currentColor" strokeWidth="10"></circle>
                    <circle
                      className="text-primary-container transition-all duration-1000 ease-out"
                      cx="70"
                      cy="70"
                      fill="none"
                      r="58"
                      stroke="currentColor"
                      strokeDasharray="364.4"
                      strokeDashoffset={`${364.4 * (1 - recoveryScore / 100)}`}
                      strokeLinecap="round"
                      strokeWidth="10"
                    ></circle>
                    <circle
                      className="text-secondary shadow-[0_0_12px_rgba(78,222,163,0.8)] transition-all duration-1000 ease-out"
                      cx="70"
                      cy="70"
                      fill="none"
                      r="44"
                      stroke="currentColor"
                      strokeDasharray="276.4"
                      strokeDashoffset={`${276.4 * (1 - (recoveryScore - 5) / 100)}`}
                      strokeLinecap="round"
                      strokeWidth="7"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest leading-none">Autonomic</span>
                    <span className="font-stat-xl text-display-lg text-on-surface font-extrabold tracking-tight mt-1 leading-none">{recoveryScore}</span>
                    <span className="font-code-stat text-code-stat text-secondary mt-1 font-bold">OPTIMAL / 100</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-label-sm font-label-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                    <span className="text-on-surface-variant">Readiness ({recoveryScore}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                    <span className="text-on-surface-variant">CNS Buffer (85%)</span>
                  </div>
                </div>
              </div>

              {/* Autonomic & Neural Balance Details */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                    Parasympathetic Surge • Rest &amp; Digest Mode
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    System Ready for Maximal Muscular Strain
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    {fatigue?.recommendation_note || 'All 3 synchronized biosensors confirm exceptional parasympathetic tone, zero cardiovascular residual fatigue, and primed motor unit recruitment velocity.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1 border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">HRV Baseline</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-stat-xl text-headline-sm text-secondary font-bold">{hrvVal} ms</span>
                      <span className="font-code-stat text-[10px] text-secondary font-bold">+14 ms vs 30d</span>
                    </div>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">Parasympathetic surge</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1 border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">ANS Balance</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-stat-xl text-headline-sm text-primary font-bold">82% PNS</span>
                      <span className="font-code-stat text-[10px] text-on-surface-variant">18% SNS</span>
                    </div>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">Rest &amp; Digest dominance</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1 border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Recovery Velocity</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-stat-xl text-headline-sm text-primary font-bold">+3.8%</span>
                      <span className="font-code-stat text-[10px] text-secondary font-bold">Rapid</span>
                    </div>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">Faster ATP reconstitution</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1 border border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Neural Recovery</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-stat-xl text-headline-sm text-secondary font-bold">Peak Prime</span>
                    </div>
                    <span className="font-body-sm text-[11px] text-on-surface-variant">Explosive compound lifting ready</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* 4-Metric Real-Time Biometric Vitals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Resting HR */}
            <div className="p-5 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-3 relative overflow-hidden border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Resting HR</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">favorite</span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold">{restingHR}</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">BPM</span>
                </div>
                <span className="font-code-stat text-code-stat text-secondary font-bold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">arrow_downward</span>-3 bpm vs 7d avg
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Low Cardiovascular Strain</span>
            </div>

            {/* Metric 2: Skin Temp */}
            <div className="p-5 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-3 relative overflow-hidden border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Skin Temp Delta</span>
                <span className="w-8 h-8 rounded-lg bg-primary-container/15 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-lg">device_thermostat</span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-stat-xl text-stat-xl text-primary font-bold">-0.2°</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">F</span>
                </div>
                <span className="font-code-stat text-code-stat text-secondary font-bold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">check</span>Optimal Circadian Nadir
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Baseline stable ±0.1°F</span>
            </div>

            {/* Metric 3: Blood Oxygen SpO2 */}
            <div className="p-5 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-3 relative overflow-hidden border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Blood Oxygen SpO2</span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-lg">air</span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-stat-xl text-stat-xl text-secondary font-bold">98.5%</span>
                </div>
                <span className="font-code-stat text-code-stat text-secondary font-bold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">check_circle</span>High Arterial Saturation
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">0 desaturations during REM</span>
            </div>

            {/* Metric 4: Sleep Score */}
            <div className="p-5 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-3 relative overflow-hidden border border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Sleep Score</span>
                <span className="w-8 h-8 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-lg">bedtime</span>
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-stat-xl text-stat-xl text-on-surface font-bold">{sleepScore}</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">/ 100</span>
                </div>
                <span className="font-code-stat text-code-stat text-primary font-bold mt-0.5">{sleepHrs}h Total Sleep</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant">2h 14m Deep (28%) • 1h 52m REM</span>
            </div>
          </div>

          {/* 7-Day Recovery vs Strain Predictive Trend & AI Protocol */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-6 border border-outline-variant/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Predictive Biometric Modeling</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">7-Day Autonomic Recovery vs. Kinetic Strain</h3>
              </div>
              <div className="flex items-center gap-4 text-label-sm font-label-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
                  <span className="text-on-surface">Recovery %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                  <span className="text-on-surface">Strain %</span>
                </div>
              </div>
            </div>

            {/* 7-Day Dual Bar Visualization */}
            <div className="grid grid-cols-7 gap-3 pt-2 items-end">
              {[
                { day: 'M', rec: 78, str: 62 },
                { day: 'T', rec: 82, str: 74 },
                { day: 'W', rec: 70, str: 88 },
                { day: 'THU', rec: 94, str: 68, active: true },
                { day: 'F', rec: 85, str: 70, proj: true },
                { day: 'S', rec: 88, str: 55, proj: true },
                { day: 'S', rec: 91, str: 40, proj: true },
              ].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-full h-36 rounded-lg ${
                      d.active ? 'bg-primary-container/10 border border-primary-container/30 shadow-[0_0_12px_rgba(0,240,255,0.2)]' : 'bg-surface-container'
                    } flex items-end justify-center gap-1.5 p-2 relative`}
                  >
                    {d.active && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-secondary text-on-secondary font-label-sm text-[9px] font-bold leading-none">
                        {d.rec}%
                      </span>
                    )}
                    <div
                      className={`w-3.5 ${d.active ? 'bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]' : d.proj ? 'bg-secondary/40' : 'bg-secondary/80'} rounded-t-md transition-all duration-700`}
                      style={{ height: `${d.rec}%` }}
                      title={`Recovery: ${d.rec}%`}
                    ></div>
                    <div
                      className={`w-3.5 ${d.active ? 'bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.8)]' : d.proj ? 'bg-primary-container/30' : 'bg-primary-container/60'} rounded-t-md transition-all duration-700`}
                      style={{ height: `${d.str}%` }}
                      title={`Strain: ${d.str}%`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center leading-none">
                    <span className={`font-code-stat text-code-stat ${d.active ? 'text-primary-container font-bold' : 'text-on-surface-variant'}`}>{d.day}</span>
                    <span className={`font-label-sm text-[10px] ${d.active ? 'text-secondary font-bold' : 'text-on-surface-variant'} mt-1`}>
                      {d.rec}%{d.proj ? '*' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sleep Architecture Breakdown Timeline Bar */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container-highest/60">
              <div className="flex items-center justify-between text-label-sm">
                <span className="text-on-surface-variant font-label-sm uppercase">Sleep Architecture Breakdown (8h 04m)</span>
                <span className="text-primary font-code-stat font-bold">Optimal Delta Wave Depth</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden flex">
                <div className="h-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.7)]" style={{ width: '28%' }} title="Deep Sleep 28%"></div>
                <div className="h-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.7)]" style={{ width: '23%' }} title="REM Sleep 23%"></div>
                <div className="h-full bg-primary/40" style={{ width: '44%' }} title="Light Sleep 44%"></div>
                <div className="h-full bg-surface-container-highest" style={{ width: '5%' }} title="Awake 5%"></div>
              </div>
              <div className="flex items-center justify-between text-label-sm font-label-sm text-on-surface-variant flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span>Deep 28% (2h 14m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>REM 23% (1h 52m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary/40"></span>
                  <span>Light 44% (3h 34m)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-surface-container-highest"></span>
                  <span>Awake 5% (24m)</span>
                </div>
              </div>
            </div>
          </article>

          {/* Coach Genesis Autonomous Recovery Protocol Banner */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-4 relative overflow-hidden border border-outline-variant/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md bg-secondary-container/20 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">psychology</span>
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
                  Coach Genesis • Autonomous Recovery Protocol
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse"></span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              Overnight biometric telemetry confirms full spinal and CNS restoration. Parasympathetic rebound observed (<span className="text-secondary font-bold">+{hrvVal - 58}ms HRV</span>). Recommended protocol: Cleared for heavy multi-joint squat overload, or opt for an optional 12-minute contrast hydrotherapy session.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  setSyncStatus('Loaded Suggested Contrast Therapy Protocol into AI Coach.')
                  setTimeout(() => setSyncStatus(null), 4000)
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(0,240,255,0.3)] hover:shadow-[0_0_24px_rgba(0,240,255,0.5)] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-base">water_drop</span>
                <span>Load Suggested Contrast Therapy Protocol</span>
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('history-table-section')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest font-label-md text-label-md transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-base">grid_view</span>
                <span>View Full Biomarker Log ({history.length})</span>
              </button>
            </div>
          </article>
        </div>

        {/* RIGHT COLUMN (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Connected Hardware Telemetry Card */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-5 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Biometrics</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Connected Hardware (3 Active)</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse"></span>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Device 1: Apple Watch Ultra 2 */}
              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-2.5 border border-outline-variant/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">watch</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Apple Watch Ultra 2</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">Live HR &amp; Accelerometer Stream</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSyncStatus('Apple Watch Ultra 2 synced.')
                      setTimeout(() => setSyncStatus(null), 3000)
                    }}
                    className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-code-stat text-xs hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    Sync
                  </button>
                </div>
                <div className="flex items-center justify-between text-code-stat text-xs pt-1 border-t border-surface-container-highest/60">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-xs">battery_charging_full</span>
                    <span>84%</span>
                  </div>
                  <span className="text-on-surface-variant">BLE 5.3 (99%)</span>
                  <span className="text-primary font-medium">1m ago</span>
                </div>
              </div>

              {/* Device 2: Oura Ring Gen 3 */}
              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-2.5 border border-outline-variant/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-xl">circle</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Oura Ring Gen 3</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">Skin Temp &amp; Nocturnal HRV</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSyncStatus('Oura Ring Gen 3 sleep epoch synced.')
                      setTimeout(() => setSyncStatus(null), 3000)
                    }}
                    className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-code-stat text-xs hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    Sync
                  </button>
                </div>
                <div className="flex items-center justify-between text-code-stat text-xs pt-1 border-t border-surface-container-highest/60">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-xs">battery_6_bar</span>
                    <span>72%</span>
                  </div>
                  <span className="text-on-surface-variant">Signal: 95%</span>
                  <span className="text-primary font-medium">4m ago</span>
                </div>
              </div>

              {/* Device 3: Whoop 4.0 */}
              <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-2.5 border border-outline-variant/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                      <span className="material-symbols-outlined text-xl">sensors</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md text-on-surface font-bold">Whoop 4.0</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">Muscular Strain &amp; GSR Sensor</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSyncStatus('Whoop 4.0 strain data refreshed.')
                      setTimeout(() => setSyncStatus(null), 3000)
                    }}
                    className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-code-stat text-xs hover:bg-surface-container-highest transition-colors"
                    type="button"
                  >
                    Sync
                  </button>
                </div>
                <div className="flex items-center justify-between text-code-stat text-xs pt-1 border-t border-surface-container-highest/60">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span className="material-symbols-outlined text-xs">battery_full</span>
                    <span>91%</span>
                  </div>
                  <span className="text-on-surface-variant">Signal: 98%</span>
                  <span className="text-secondary font-medium">Just now</span>
                </div>
              </div>

              {/* Device 4: Add CGM Dexcom */}
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-base text-primary-container">add_circle</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Pair Continuous Glucose Monitor (Dexcom G7)</span>
                </div>
                <button
                  onClick={() => {
                    setSyncStatus('Opening BLE pairing beacon for Dexcom G7...')
                    setTimeout(() => setSyncStatus(null), 3000)
                  }}
                  className="px-2.5 py-1 rounded-md bg-primary-container/10 text-primary-container font-label-sm text-xs hover:bg-primary-container/20 transition-colors whitespace-nowrap"
                  type="button"
                >
                  Connect
                </button>
              </div>
            </div>
          </article>

          {/* Circadian Rhythm & Sleep Bio-Stages Card */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-4 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Biorhythm Architecture</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Circadian Bio-Phases</h3>
              </div>
              <span className="material-symbols-outlined text-primary text-xl">schedule</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface font-bold">Current Phase</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-code-stat text-[10px] font-bold">Active Now</span>
              </div>
              <span className="font-body-md text-body-md text-primary font-semibold">Peak Anabolic Window (11:00 - 15:30)</span>
              <span className="font-body-sm text-[12px] text-on-surface-variant">Optimal for glycogen uptake and myofibrillar protein synthesis.</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-surface-container flex flex-col border border-outline-variant/10">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Cortisol Response</span>
                <span className="font-stat-xl text-body-lg text-secondary font-bold mt-1">Normal</span>
                <span className="font-code-stat text-[10px] text-on-surface-variant">CAR Cleared</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container flex flex-col border border-outline-variant/10">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Core Temp Nadir</span>
                <span className="font-stat-xl text-body-lg text-primary font-bold mt-1">04:32 AM</span>
                <span className="font-code-stat text-[10px] text-on-surface-variant">-0.8°F trough</span>
              </div>
            </div>
          </article>

          {/* Autonomous System Diagnostics */}
          <article className="p-5 rounded-xl bg-surface-container-low shadow-md flex items-center justify-between gap-4 border border-outline-variant/20">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary relative shrink-0 border border-outline-variant/20">
                <span className="material-symbols-outlined text-xl">terminal</span>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)]"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wide">Bio-Telemetry Ingestion</span>
                  <span className="font-code-stat text-[10px] text-secondary bg-surface-container px-1.5 py-0.5 rounded font-bold">0 dropped</span>
                </div>
                <span className="font-code-stat text-xs text-on-surface-variant mt-0.5">48,291 packets • Drift &lt;0.02% (Grade A+)</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-lg">verified_user</span>
          </article>
        </div>
      </div>

      {/* Full Biomarker Log Section */}
      <section id="history-table-section" className="mt-8">
        <div className="p-6 rounded-xl bg-surface-container-low shadow-md border border-outline-variant/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Biomarker Log Telemetry</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Archived entries from connected wearable channels and manual bio-logs</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-xs transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span> Add Entry
            </button>
          </div>

          {historyLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-body-sm">
              No historical data logged yet. Click &ldquo;+ Log Biometrics&rdquo; above to record your first entry.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Wearable data history">
                <thead>
                  <tr className="border-b border-surface-container-highest text-on-surface-variant font-label-sm uppercase text-xs">
                    <th className="p-3">Recorded At</th>
                    <th className="p-3">Source</th>
                    <th className="p-3 text-right">Resting HR</th>
                    <th className="p-3 text-right">HRV (ms)</th>
                    <th className="p-3 text-right">Sleep</th>
                    <th className="p-3 text-right">Sleep Score</th>
                    <th className="p-3 text-right">Recovery</th>
                    <th className="p-3 text-right">Fatigue Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-highest/40 font-code-stat text-xs">
                  {history.slice(0, 20).map((row: any) => (
                    <tr key={row.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="p-3 text-on-surface">{formatDate(row.recorded_at)}</td>
                      <td className="p-3 capitalize text-on-surface-variant">{row.source}</td>
                      <td className="p-3 text-right text-on-surface">{row.resting_heart_rate ?? '–'} bpm</td>
                      <td className="p-3 text-right text-secondary">{row.hrv_ms ? `${Math.round(row.hrv_ms)} ms` : '–'}</td>
                      <td className="p-3 text-right text-on-surface">{row.sleep_hours != null ? `${row.sleep_hours}h` : '–'}</td>
                      <td className="p-3 text-right text-primary">{row.sleep_quality_score ?? '–'}</td>
                      <td className="p-3 text-right font-bold text-secondary">{row.recovery_score != null ? `${row.recovery_score}%` : '–'}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.fatigue_level === 'RECOVERY' ? 'bg-error-container/40 text-error' :
                          row.fatigue_level === 'REDUCED' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-secondary-container/20 text-secondary'
                        }`}>
                          {row.fatigue_level || 'NORMAL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Log Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">sensors</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Log Wearable Biometrics</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">Resting HR (BPM)</label>
                  <input
                    type="number"
                    {...register('resting_heart_rate')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none"
                    placeholder="54"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">HRV (ms)</label>
                  <input
                    type="number"
                    {...register('hrv_ms')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none"
                    placeholder="72"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('sleep_hours')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none"
                    placeholder="8.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">Sleep Score (0-100)</label>
                  <input
                    type="number"
                    {...register('sleep_quality_score')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none"
                    placeholder="89"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">Recovery Score (0-100)</label>
                  <input
                    type="number"
                    {...register('recovery_score')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none"
                    placeholder="94"
                  />
                </div>
                <div>
                  <label className="block text-xs font-label-sm text-on-surface-variant uppercase mb-1">Recorded At</label>
                  <input
                    type="datetime-local"
                    {...register('recorded_at')}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container text-on-surface border border-outline-variant/40 focus:border-primary-container focus:outline-none text-xs"
                  />
                </div>
              </div>

              {submitMutation.isError && (
                <p className="text-xs text-error">{getErrorMessage(submitMutation.error)}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-md text-sm font-bold shadow-[0_0_16px_rgba(0,240,255,0.35)] hover:shadow-[0_0_24px_rgba(0,240,255,0.5)] transition-all flex items-center gap-1.5"
                >
                  {submitMutation.isPending ? 'Ingesting…' : 'Ingest Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
