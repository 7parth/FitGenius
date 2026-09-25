import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { api, nutritionApi } from '@/lib/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Dynamic user data queries
  const { data: summary } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => api.get('/progress/summary').then((r) => r.data).catch(() => null),
  })

  const { data: recData } = useQuery({
    queryKey: ['recommendation-latest'],
    queryFn: () => api.get('/recommendations/latest').then((r) => r.data).catch(() => null),
  })

  const { data: nutrition } = useQuery({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getTodaySummary().catch(() => null),
  })

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col w-full pb-16 px-4 lg:px-8 pt-6 max-w-7xl mx-auto">
      {/* Top Greeting & Header Bar */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-code-stat text-code-stat uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              Bio-OS v4.2 Online
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-secondary">cloud_done</span>
              {todayDateStr} • Telemetry Synced
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight flex items-center gap-3">
            Welcome back, {user?.display_name || 'Alex'}! <span className="text-primary-container">⚡</span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Central neural engine recalibrated with your overnight biometric telemetry. Peak metabolic window active until 14:30.
          </p>
        </div>

        {/* Quick Vital Badges & CTA */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="w-9 h-9 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-lg">ecg_heart</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">HRV Baseline</span>
              <span className="font-stat-xl text-headline-sm text-secondary font-bold leading-none">
                68 ms <span className="font-label-sm text-label-sm text-secondary font-normal uppercase">• Optimal</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-container-low shadow-sm border border-surface-container-high/40">
            <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-lg">bolt</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Neural Load</span>
              <span className="font-stat-xl text-headline-sm text-primary font-bold leading-none">Low Strain</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/workout/recommend')}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:shadow-[0_0_36px_rgba(0,240,255,0.6)] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-lg font-bold group-hover:rotate-90 transition-transform">add</span>
            <span>+ Log Workout</span>
          </button>
        </div>
      </section>

      {/* Bento Grid 3 Columns Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 2 COLUMNS (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Hero Feature Card: AI Workout Recommendation */}
          <article className="relative overflow-hidden rounded-xl bg-surface-container-low shadow-xl flex flex-col justify-between border border-surface-container-high/40">
            {/* Background Ambient Accent Glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-container/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-tertiary-container/10 blur-3xl pointer-events-none"></div>

            <div className="p-6 md:p-8 flex flex-col gap-6 relative z-10">
              {/* Card Header & Status Chips */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-primary-container/15 text-primary-container font-label-sm text-label-sm uppercase tracking-widest flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    AI Prescribed Protocol
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">
                    Intermediate Tier
                  </span>
                </div>
                <div className="flex items-center gap-2 font-code-stat text-code-stat text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm text-primary">sensors</span>
                  <span>CALIBRATION ID: #AI-HYP-992</span>
                </div>
              </div>

              {/* Main Workout Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 flex flex-col gap-3">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                    Today's Focus • Hypertrophy
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                    {recData?.template_name || 'Full-Body Hypertrophy & Core Surge'}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Calibrated for maximum mechanical tension aligned with your <span className="text-secondary font-bold">94% HRV baseline</span>. Prioritizes prime mover strength with high neural recovery buffer.
                  </p>

                  {/* Quick Workout Telemetry Tokens */}
                  <div className="flex items-center gap-5 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-primary">timer</span>
                      <div className="flex flex-col">
                        <span className="font-stat-xl text-headline-sm text-on-surface font-bold leading-tight">45</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Minutes</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-surface-container-highest"></div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-secondary">local_fire_department</span>
                      <div className="flex flex-col">
                        <span className="font-stat-xl text-headline-sm text-on-surface font-bold leading-tight">380</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Est. kCal</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-surface-container-highest"></div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-tertiary-fixed-dim">reorder</span>
                      <div className="flex flex-col">
                        <span className="font-stat-xl text-headline-sm text-on-surface font-bold leading-tight">6</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Key Sets</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workout Visual Preview Box */}
                <div className="md:col-span-5 relative group overflow-hidden rounded-xl bg-surface-container shadow-md h-52">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{
                      backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/40 to-transparent"></div>
                  {/* Bottom Overlaid Telemetry Badge */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-lowest/80 backdrop-blur-md">
                    <span className="font-code-stat text-code-stat text-primary flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
                      L4 Squat + Barbell Row
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Live Pose Ready</span>
                  </div>
                </div>
              </div>

              {/* Target Muscles Badges & Action CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-surface-container-high/40">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mr-1">
                    Target Prime Movers:
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">
                    Quads
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">
                    Chest
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-secondary font-label-sm text-label-sm">
                    Core Stability
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm">
                    Deltoids
                  </span>
                </div>
                <button
                  onClick={() => navigate('/workout/recommend')}
                  className="group flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(0,240,255,0.35)] hover:shadow-[0_0_36px_rgba(0,240,255,0.6)] transition-all"
                  type="button"
                >
                  <span>Start Workout</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>
          </article>

          {/* Sub-grid: 2 Columns for Weekly Cadence & AI Coach Genesis Insight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Cadence & Volume Tracker */}
            <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-5 relative overflow-hidden border border-surface-container-high/40">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Weekly Training Volume
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Weekly Cadence</h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  <span className="font-label-sm text-label-sm font-bold">5 Day Streak! 🔥</span>
                </div>
              </div>

              {/* Volume Summary Stats */}
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-stat-xl text-stat-xl text-primary font-bold">215</span>
                  <span className="font-body-md text-body-md text-on-surface-variant">/ 300 min target</span>
                </div>
                <span className="font-code-stat text-code-stat text-secondary font-bold">71% REACHED</span>
              </div>

              {/* Volume Progress Bar */}
              <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary-container rounded-full shadow-[0_0_12px_rgba(0,240,255,0.8)]"
                  style={{ width: '71%' }}
                ></div>
              </div>

              {/* 7-Day Micro Bar Visualization */}
              <div className="grid grid-cols-7 gap-2 pt-2 items-end">
                {/* Mon */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-primary/40 rounded-md" style={{ height: '65%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">M</span>
                </div>
                {/* Tue */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-primary/50 rounded-md" style={{ height: '75%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">T</span>
                </div>
                {/* Wed */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-secondary/80 rounded-md" style={{ height: '90%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">W</span>
                </div>
                {/* Thu (Today) */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-primary-container/20 flex flex-col justify-end p-1 relative shadow-[0_0_12px_rgba(0,240,255,0.2)]">
                    <div className="w-full bg-primary-container rounded-md" style={{ height: '80%' }}></div>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container font-label-sm text-[9px] font-bold leading-none">
                      45m
                    </span>
                  </div>
                  <span className="font-code-stat text-code-stat text-primary-container font-bold">THU</span>
                </div>
                {/* Fri */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-surface-container-highest rounded-md" style={{ height: '0%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">F</span>
                </div>
                {/* Sat */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-surface-container-highest rounded-md" style={{ height: '0%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">S</span>
                </div>
                {/* Sun */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-full h-16 rounded-lg bg-surface-container-high flex flex-col justify-end p-1">
                    <div className="w-full bg-surface-container-highest rounded-md" style={{ height: '0%' }}></div>
                  </div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">S</span>
                </div>
              </div>
            </article>

            {/* AI Coach Genesis Active Insight Card */}
            <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col justify-between gap-5 relative overflow-hidden border border-surface-container-high/40">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-tertiary-container/30 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary-fixed-dim uppercase tracking-wider font-bold">
                      Coach Genesis • Active Note
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim shadow-[0_0_8px_rgba(208,188,255,0.8)]"></span>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-base">warning</span>
                    <span className="font-label-md text-label-md text-error font-bold">Kinetic Strain Detected</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Your hamstrings registered mild residual fatigue during yesterday’s deadlifts. AI recommends a targeted 5-minute dynamic flow before heavy squat loads to minimize pelvic tilt risk.
                  </p>
                </div>
              </div>

              {/* Protocol Prompt & Action Button */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Targeted Mobility</span>
                  <span className="font-code-stat text-code-stat text-secondary font-bold">+18% Hip Flexion</span>
                </div>
                <button
                  onClick={() => navigate('/coach')}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-tertiary-container/20 text-tertiary hover:bg-tertiary-container/30 transition-colors font-label-md text-label-md font-semibold"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">play_circle</span>
                    <span>View Warm-up Sequence (5 min)</span>
                  </span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </article>
          </div>
        </div>

        {/* RIGHT COLUMN (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Bio-Readiness Widget with Radial Arc Gauge */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-6 relative overflow-hidden border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Continuous Telemetry
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Bio-Readiness</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-[0_0_12px_rgba(78,222,163,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Peak Prime
              </span>
            </div>

            {/* Radial Gauge & Big Score Display */}
            <div className="flex flex-col items-center justify-center relative py-2">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    className="text-surface-container-highest"
                    cx="60"
                    cy="60"
                    fill="none"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="9"
                  ></circle>
                  <circle
                    className="text-secondary transition-all duration-1000"
                    cx="60"
                    cy="60"
                    fill="none"
                    r="50"
                    stroke="currentColor"
                    strokeDasharray="314.159"
                    strokeDashoffset="18.85"
                    strokeLinecap="round"
                    strokeWidth="9"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest leading-none">
                    Score
                  </span>
                  <span className="font-stat-xl text-display-lg text-on-surface font-extrabold tracking-tight mt-1 leading-none">
                    94
                  </span>
                  <span className="font-code-stat text-code-stat text-secondary mt-1">/ 100</span>
                </div>
              </div>
            </div>

            {/* Continuous Telemetry Pods */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-container">
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-sm text-primary mb-1">bedtime</span>
                <span className="font-stat-xl text-body-lg text-on-surface font-bold leading-tight">7.8h</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Sleep</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-sm text-error mb-1">favorite</span>
                <span className="font-stat-xl text-body-lg text-on-surface font-bold leading-tight">54</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Rest HR</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-sm text-secondary mb-1">vital_signs</span>
                <span className="font-stat-xl text-body-lg text-secondary font-bold leading-tight">68 ms</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">HRV</span>
              </div>
            </div>
          </article>

          {/* Nutrient Intake Telemetry Card */}
          <article className="p-6 rounded-xl bg-surface-container-low shadow-md flex flex-col gap-6 border border-surface-container-high/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Metabolic Fueling
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Nutrient Intake</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-code-stat text-code-stat">
                {nutrition ? `${nutrition.goal.target_calories - nutrition.total_calories} kcal left` : '550 kcal left'}
              </span>
            </div>

            {/* Calorie Ring + Overview */}
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container-highest"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className="text-primary-container"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="251.3"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-stat-xl text-headline-sm text-on-surface font-bold leading-none">
                    {nutrition?.total_calories || '1,650'}
                  </span>
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">kCal</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Target Budget
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none">
                  {nutrition?.goal?.target_calories || 2200} kcal
                </span>
                <span className="font-body-sm text-body-sm text-secondary flex items-center gap-1 mt-1 font-medium">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  On track for recovery goal
                </span>
              </div>
            </div>

            {/* Macro Progress Bars */}
            <div className="flex flex-col gap-3.5">
              {/* Protein */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                    Protein
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-code-stat text-code-stat text-on-surface">
                      {nutrition ? `${nutrition.total_protein_g}g / ${nutrition.goal.target_protein_g}g` : '135g / 160g'}
                    </span>
                    <span className="font-code-stat text-code-stat text-primary-container font-bold">84%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full" style={{ width: '84%' }}></div>
                </div>
              </div>

              {/* Carbs */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    Carbohydrates
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-code-stat text-code-stat text-on-surface">
                      {nutrition ? `${nutrition.total_carbs_g}g / ${nutrition.goal.target_carbs_g}g` : '180g / 250g'}
                    </span>
                    <span className="font-code-stat text-code-stat text-secondary font-bold">72%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '72%' }}></div>
                </div>
              </div>

              {/* Fats */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                    Fats
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-code-stat text-code-stat text-on-surface">
                      {nutrition ? `${nutrition.total_fat_g}g / ${nutrition.goal.target_fat_g}g` : '52g / 70g'}
                    </span>
                    <span className="font-code-stat text-code-stat text-tertiary-fixed-dim font-bold">74%</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full bg-tertiary-fixed-dim rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
            </div>
          </article>

          {/* Pose Engine Standby Card */}
          <article
            onClick={() => navigate('/workout/pose')}
            className="p-5 rounded-xl bg-surface-container-low shadow-md flex items-center justify-between gap-4 relative overflow-hidden group cursor-pointer border border-surface-container-high/40 hover:bg-surface-container transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container relative shrink-0">
                <span className="material-symbols-outlined text-2xl">videocam</span>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.9)] animate-pulse"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-primary-container uppercase font-bold tracking-wide">
                    Vision Engine
                  </span>
                  <span className="font-code-stat text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                    60 FPS
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-medium mt-0.5">
                  Squat Calibration Ready
                </span>
              </div>
            </div>
            <button
              aria-label="Test Pose Tracker Calibration"
              className="p-2.5 rounded-lg bg-surface-container-high text-on-surface hover:text-primary-container hover:bg-surface-container-highest transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">tune</span>
            </button>
          </article>
        </div>
      </div>
    </div>
  )
}
