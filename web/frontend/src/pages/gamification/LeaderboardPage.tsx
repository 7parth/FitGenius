import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week')
  const [subTab, setSubTab] = useState<'global' | 'friends' | 'gym'>('global')
  const [pullUpLogged, setPullUpLogged] = useState(false)
  const [joinedSprint, setJoinedSprint] = useState(false)

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', timeframe],
    queryFn: () => api.get('/gamification/leaderboard', { params: { limit: 20 } }).then(r => r.data).catch(() => null),
  })

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Ambient Glow Field */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[840px] h-[340px] bg-primary-container/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-12 w-[380px] h-[280px] bg-secondary-container/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Section */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6 pb-10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-code-stat text-code-stat shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
                GLOBAL LEAGUE • CYCLE 14
              </span>
              <span className="text-on-surface-variant font-code-stat text-code-stat">RESET IN 2D 14H 22M</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Community Leaderboard &amp; Challenges
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Compete, earn XP, and level up with global lifters. Real-time telemetry synced across 14,892 connected biometric rigs.
            </p>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center p-1.5 rounded-xl bg-surface-container-low shadow-inner self-start md:self-end">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                timeframe === 'week'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_18px_rgba(0,240,255,0.3)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                timeframe === 'month'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_18px_rgba(0,240,255,0.3)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-4 py-2 rounded-lg font-label-md text-label-md transition-all ${
                timeframe === 'all'
                  ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_18px_rgba(0,240,255,0.3)]'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              All-Time
            </button>
          </div>
        </div>

        {/* Top 3 Global Athletes Podium */}
        <div className="relative z-10 w-full mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-5xl mx-auto pt-8">
            {/* 2nd Place: Elena V. (Left) */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              <div className="relative mb-3 flex flex-col items-center">
                <div className="absolute -top-6 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-slate-300 font-label-sm text-label-sm shadow-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-slate-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                    military_tech
                  </span>
                  RANK 02
                </div>
                <div className="relative p-1 rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-[0_0_24px_rgba(203,213,225,0.4)]">
                  <img
                    alt="Elena V."
                    className="w-20 h-20 rounded-full object-cover bg-surface-container-high"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCSGZR-AskJWEXK0bGxM2dBKKAbnTnjfrxngHqlP9Wz3ZgNcVDM5HhK_ZzH-01zsURJnO8GhMUJHJTqAAXvqWyP_tQPh4XjiJWVSv2LOEqQTGzGjVbq57n2Gj3Lb9BRanwtVgmfw7MM3zpDDUJSNCuNur3XuAu72yHC3z2DbIHSHcoF6XCO6E_RbWzAtLUSEpKBeoApTlxUvknxDVqF2XlBnaIsCaQPVYAxIqiGUPoqy9--nuA4X7jpQ"
                  />
                </div>
                <span className="absolute -bottom-2 px-2 py-0.5 rounded bg-surface-container-lowest font-code-stat text-code-stat text-slate-300 shadow">
                  LV 38
                </span>
              </div>
              <div className="w-full h-44 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-5 flex flex-col justify-between items-center text-center shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col items-center">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Elena V.</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                    Iron Sanctuary Labs
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-stat-xl text-stat-xl text-slate-200 font-bold tracking-tight">11,200</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest -mt-1">XP PTS</span>
                </div>
                <div className="w-full flex items-center justify-between text-on-surface-variant font-code-stat text-code-stat pt-2">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-xs">arrow_drop_up</span>+1 rank
                  </span>
                  <span>18-Day Streak 🔥</span>
                </div>
              </div>
            </div>

            {/* 1st Place: Marcus K. (Center - Elevated) */}
            <div className="order-1 md:order-2 flex flex-col items-center -mt-6">
              <div className="relative mb-4 flex flex-col items-center">
                <div className="absolute -top-9 flex items-center justify-center animate-bounce">
                  <span className="material-symbols-outlined text-2xl text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                </div>
                <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-on-primary-fixed font-label-sm text-label-sm font-bold shadow-[0_0_16px_rgba(251,191,36,0.6)] flex items-center gap-1 z-10">
                  CHAMPION
                </div>
                <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-amber-200 via-amber-400 to-yellow-500 shadow-[0_0_36px_rgba(251,191,36,0.5)]">
                  <img
                    alt="Marcus K."
                    className="w-28 h-28 rounded-full object-cover bg-surface-container-high"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuApcqjlhtHFtKWrUxph9E5qpWO69Iq1cNXn2bIcTJhxkFOBNgXSyEuoEpqOi6CZXPhHiDmZSCFkX9jHpimNKAoz0GYriwxE_IkA8EWhsYUhc4-97Sjtcpp5rBFK9LpN6d26itm-LyORAeoC04fMdP-b8xYrevM1gZC5eKfWE7AFabn6mP9B9FsqX8m8hytPBLYkNQOkrdY8ovDHWXyJ_XRbSEybqUEH6pWM9OSym2xbDt8KHgy4MAblyQ"
                  />
                </div>
                <span className="absolute -bottom-2 px-2.5 py-0.5 rounded bg-surface-container-lowest font-code-stat text-code-stat text-amber-300 shadow font-bold">
                  LV 42
                </span>
              </div>
              <div className="w-full h-56 rounded-2xl bg-gradient-to-b from-surface-container-high/90 to-surface-container-low/95 backdrop-blur-2xl p-6 flex flex-col justify-between items-center text-center shadow-[0_16px_40px_-4px_rgba(0,0,0,0.8),0_0_32px_rgba(251,191,36,0.12)]">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-md text-headline-md text-on-surface font-bold">Marcus K.</span>
                    <span className="material-symbols-outlined text-base text-amber-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                      bolt
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Apex Kinetic Club
                  </span>
                </div>
                <div className="flex flex-col items-center my-1">
                  <span className="font-display-lg-mobile text-display-lg-mobile text-amber-300 font-bold leading-none tracking-tight drop-shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                    12,450
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-1">
                    XP PTS • UNDEFEATED
                  </span>
                </div>
                <div className="w-full flex items-center justify-between text-on-surface-variant font-code-stat text-code-stat pt-2">
                  <span className="text-amber-300 font-bold">Defending 3w</span>
                  <span className="text-on-surface">32-Day Streak 🔥</span>
                </div>
              </div>
            </div>

            {/* 3rd Place: David S. (Right) */}
            <div className="order-3 flex flex-col items-center">
              <div className="relative mb-3 flex flex-col items-center">
                <div className="absolute -top-6 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-amber-600 font-label-sm text-label-sm shadow-md flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    military_tech
                  </span>
                  RANK 03
                </div>
                <div className="relative p-1 rounded-full bg-gradient-to-b from-amber-600 via-yellow-700 to-amber-900 shadow-[0_0_24px_rgba(217,119,6,0.35)]">
                  <img
                    alt="David S."
                    className="w-20 h-20 rounded-full object-cover bg-surface-container-high"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4wQQ4_KWUm20QxM4ebb26IzISdEwRCsz2rc2AwF5M65IAUoeecV33WHLvvzo-wjpeTy1UGx3OYqHpEup0G0Kag5MIf_1AVqXDzg-hoXHmuExf0wUuHkEKBk4j-7ZocxB21PWUVtlxWxyZ7kYm_i8WfjGjb0-592cwps78BU1k6Dj_MiWCruUU0OY2PYSOXK5o-vFVdjZtI3a9mskABNtT2N17MO7lVKs6wgErexc9sx42WtLKuqxV9A"
                  />
                </div>
                <span className="absolute -bottom-2 px-2 py-0.5 rounded bg-surface-container-lowest font-code-stat text-code-stat text-amber-500 shadow">
                  LV 35
                </span>
              </div>
              <div className="w-full h-36 rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-5 flex flex-col justify-between items-center text-center shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)]">
                <div className="flex flex-col items-center">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">David S.</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-xs text-primary">fitness_center</span>
                    Valkyrie Barbell
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-stat-xl text-stat-xl text-amber-400 font-bold tracking-tight">10,850</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest -mt-1">XP PTS</span>
                </div>
                <div className="w-full flex items-center justify-between text-on-surface-variant font-code-stat text-code-stat pt-2">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-xs">arrow_drop_up</span>+3 rank
                  </span>
                  <span>15-Day Streak 🔥</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Content: Rankings (60%) vs Active Challenges & Badges (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (60% -> 7 Cols): Contender Rankings */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low/80 backdrop-blur-md p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_rgba(78,222,163,0.8)]" />
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Contender Rankings</h2>
                <p className="font-code-stat text-code-stat text-on-surface-variant">TELEMETRY STREAM: 60 FPS LIVE SYNC</p>
              </div>
            </div>
            {/* Filter Sub-tabs */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl">
              <button
                onClick={() => setSubTab('global')}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                  subTab === 'global' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Global
              </button>
              <button
                onClick={() => setSubTab('friends')}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                  subTab === 'friends' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Friends (24)
              </button>
              <button
                onClick={() => setSubTab('gym')}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm font-semibold transition-all ${
                  subTab === 'gym' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
                type="button"
              >
                Local Gym
              </button>
            </div>
          </div>

          {/* Rankings Table Pod */}
          <div className="bg-surface-container-low/70 backdrop-blur-xl rounded-2xl p-2 flex flex-col gap-2 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            {/* Table Column Legend */}
            <div className="grid grid-cols-12 px-4 py-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              <span className="col-span-1 text-center">Pos</span>
              <span className="col-span-5">Athlete</span>
              <span className="col-span-2 text-center">Streak</span>
              <span className="col-span-2 text-right">XP Points</span>
              <span className="col-span-2 text-right">Trend</span>
            </div>

            {/* Rank 04: Sarah Connor */}
            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface-container/60 hover:bg-surface-container-high transition-colors group">
              <div className="col-span-1 text-center font-code-stat text-code-stat text-on-surface font-bold">04</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest shrink-0 overflow-hidden shadow-inner">
                  <img
                    alt="Sarah Connor"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx2fyjQzj-e-nMO1wRuuq5QqTTO3yHrYPJdR5eCzcJc6EJc_feB6MTyEjbMRIiZATJ61TJRtwDb_oq3HeRbJOq947l8xB78tWw_q8NucwdzOxmJUk0O6upzhCwHS1cSejns_09MOv_yj-diBUjdKk7Ww69LZqZgOKrOR90TbKH54jUGVAcTH6yqsos_O3b8HBjA47jWnYIG6f3N5r2OKdsa97Qod22hMvyWvyOQtNou4w3dqnEbUkVuA"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    Sarah Connor
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Lv 33 • Calisthenics</span>
                </div>
              </div>
              <div className="col-span-2 text-center font-label-md text-label-md text-amber-300 font-medium">12 Days 🔥</div>
              <div className="col-span-2 text-right font-stat-xl-mobile text-headline-sm text-on-surface font-bold">9,940</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1 font-label-sm text-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm font-bold">arrow_drop_up</span>
                <span>2</span>
              </div>
            </div>

            {/* Rank 05: Kenji Sato */}
            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface-container/40 hover:bg-surface-container-high transition-colors group">
              <div className="col-span-1 text-center font-code-stat text-code-stat text-on-surface font-bold">05</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest shrink-0 overflow-hidden shadow-inner">
                  <img
                    alt="Kenji Sato"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_CW06u_tQzXNQyAB9dV0wmAk_u1Yxpc2ZdWLssID38aD9jM05QR7XpPPF7ecvuDZuSeutlqNc_IYiw2-2IhfPkes24tTM3Jg1_P0MY6BKgqoeGfsj1vzj2tDcOMbwaQ8QVPQm5nTEunWzfYwG3Kkt1Cy-DuKsIobAdk_OrX-klrXy9AEp7qto6h8ZtfDyvxlRCOAR0ljZ9QwbZZ7XpV1IM0t4xgarqAtXO4lyT6UvkEE-KHakVbJQDw"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    Kenji Sato
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Lv 31 • Hyrox Elite</span>
                </div>
              </div>
              <div className="col-span-2 text-center font-label-md text-label-md text-amber-300 font-medium">8 Days 🔥</div>
              <div className="col-span-2 text-right font-stat-xl-mobile text-headline-sm text-on-surface font-bold">9,620</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1 font-label-sm text-label-sm text-error">
                <span className="material-symbols-outlined text-sm font-bold">arrow_drop_down</span>
                <span>1</span>
              </div>
            </div>

            {/* Rank 06: Chloe Bennett */}
            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface-container/60 hover:bg-surface-container-high transition-colors group">
              <div className="col-span-1 text-center font-code-stat text-code-stat text-on-surface font-bold">06</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest shrink-0 overflow-hidden shadow-inner">
                  <img
                    alt="Chloe Bennett"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5vEfgvAXtyI4l8hfOzTA2mnIIl313QK1jnQon6bzXllT7YBqec5q8x47gDKydIefW38ndgchWSxMjq12TXaIRg145bf_opRao86Qs-DYxTHAhS5fDVWpnKC-dUV2LSIUvAvkMkXDR1rqwty61c6WYIjw9ZXWz892cms1ZSikipc6_0VITs7g1yTRCiXeeTgHwJBqnURcO1DsONZMT9zvWeMOnSi8BgmD6T3SEOY-V1MeZT0Vs6CidXQ"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    Chloe Bennett
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Lv 29 • Olympic Lift</span>
                </div>
              </div>
              <div className="col-span-2 text-center font-label-md text-label-md text-amber-300 font-medium">14 Days 🔥</div>
              <div className="col-span-2 text-right font-stat-xl-mobile text-headline-sm text-on-surface font-bold">9,150</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1 font-label-sm text-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm font-bold">arrow_drop_up</span>
                <span>3</span>
              </div>
            </div>

            {/* Rank 07: Liam O'Connor */}
            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface-container/40 hover:bg-surface-container-high transition-colors group">
              <div className="col-span-1 text-center font-code-stat text-code-stat text-on-surface font-bold">07</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest shrink-0 overflow-hidden shadow-inner">
                  <img
                    alt="Liam O'Connor"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_6doANCDQPteyz_SLG6MRXvgN0PpaHQKGBFokNIkmPb4uyUlbpWkAtKm1fXigjBn9l-b1I6hVw82ohWggm2nifSyIjlnVQcazSsuGUJuojjRbwMVJunCEfPip9fhkb01_d9OvAjU0MzZSBcOYew9_AuIOtQJq_2aF5g_PXEyebBBbprqmjffruI72ctAZmpJw3ZjiFGQh8O0tPjmzUJoGwniRcnh3OjZt7UoV-wOeiSfcnqkFG-OB8Q"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    Liam O'Connor
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Lv 28 • Cross-Athlete</span>
                </div>
              </div>
              <div className="col-span-2 text-center font-label-md text-label-md text-amber-300 font-medium">6 Days 🔥</div>
              <div className="col-span-2 text-right font-stat-xl-mobile text-headline-sm text-on-surface font-bold">8,820</div>
              <div className="col-span-2 text-right flex items-center justify-end font-label-sm text-label-sm text-on-surface-variant">
                <span>—</span>
              </div>
            </div>

            {/* Rank 08: Maya Patel */}
            <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-surface-container/60 hover:bg-surface-container-high transition-colors group">
              <div className="col-span-1 text-center font-code-stat text-code-stat text-on-surface font-bold">08</div>
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-surface-container-highest shrink-0 overflow-hidden shadow-inner">
                  <img
                    alt="Maya Patel"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZefbXxJTLU4KGcIwEDTMSA5v23NZC7eAVz_vDa9ZYzlDX2MHIG6Kyf19bK70iROOoiEzDq0N29t53ohtBzR_0iwXVF09bIpr_lwRmHEGW8_nJ88a1RkFd2XYm-1VJWG09rCXsFN1wDyU7Mdmqf_xMqQ6nIORFa19oOKzOwrlKDTCz_BqPp3JPLXv7hn-VjFixLNju0i_yb3qXso2a0vkVdvqpkjNlLqD38b6ziTXswBUl7TGhhYxqAQ"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                    Maya Patel
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">Lv 27 • Power Endurance</span>
                </div>
              </div>
              <div className="col-span-2 text-center font-label-md text-label-md text-amber-300 font-medium">9 Days 🔥</div>
              <div className="col-span-2 text-right font-stat-xl-mobile text-headline-sm text-on-surface font-bold">8,610</div>
              <div className="col-span-2 text-right flex items-center justify-end gap-1 font-label-sm text-label-sm text-secondary">
                <span className="material-symbols-outlined text-sm font-bold">arrow_drop_up</span>
                <span>1</span>
              </div>
            </div>
          </div>

          {/* Pinned Sticky Current User Bar (Parth Waradkar) */}
          <div className="sticky bottom-4 z-20 w-full rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container-highest to-surface-container-high p-4 shadow-[0_12px_32px_rgba(0,0,0,0.8),0_0_24px_rgba(0,240,255,0.2)] border border-primary-container/20">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-bold shadow-[0_0_12px_rgba(0,240,255,0.6)]">
                    #14
                  </span>
                  <div className="relative">
                    <img
                      alt="Parth Waradkar"
                      className="w-11 h-11 rounded-full object-cover shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjZpO_sRgX7rRdAqhuKyGsDj0COXfnsJmP09P_BAattNL1aMTwrngmkMzL9ON7qkM6Rim3gggQXXPWMYYA8GLOFYLmgsNVUMvpCcOgF3PwOzoB2rfOoXAmP6yNg1mG_GwTt4iX-bRot3wHXu58mUMRRg_Yicoya30-vBYfVdX_SLEMDDHMmJuQGLjKoU9y2PGyyHGFDTVDoAsuigh8COMLd0dT6V8vmoj0iikyHeKAkjWyn50GkDz4Xg"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.9)]" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm text-primary font-bold">Parth Waradkar</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm font-bold uppercase">
                        YOU
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant font-code-stat text-code-stat">
                      <span className="text-secondary font-semibold">Top 15% Global</span>
                      <span>•</span>
                      <span className="text-amber-300">5-Day Streak 🔥</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-stat-xl text-stat-xl text-primary font-bold leading-none">6,240</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">XP</span>
                  </div>
                  <span className="font-code-stat text-code-stat text-secondary mt-1">
                    +320 XP to surpass Rank 13 (T. Vance)
                  </span>
                </div>
              </div>

              {/* Level Progress Track */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface font-semibold">Level 24 Bio-Adept</span>
                  <span className="text-primary font-code-stat text-code-stat">780 / 1,000 XP to Level 25</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-secondary via-primary-container to-primary shadow-[0_0_12px_rgba(0,240,255,0.7)]"
                    style={{ width: '78%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (40% -> 5 Cols): Active Challenges & Badges */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                flag
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Active Community Challenges</h2>
            </div>
            <button
              onClick={() => toast.info('All 8 global community challenges unlocked.')}
              className="text-primary hover:text-primary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold transition-colors"
              type="button"
            >
              Browse All (8)
            </button>
          </div>

          {/* Challenge Card 1: 30-Day Pull-Up Milestone */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] group hover:shadow-[0_8px_28px_rgba(0,240,255,0.15)] transition-all">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none group-hover:bg-primary-container/20 transition-all" />
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container shadow-inner">
                    <span className="material-symbols-outlined text-2xl">exercise</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      30-Day Pull-Up Milestone
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-label-sm text-label-sm font-semibold">
                        Active
                      </span>
                      <span className="font-code-stat text-code-stat text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">group</span>
                        2,410 Lifters
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container font-code-stat text-code-stat text-amber-300 font-bold">
                    +500 XP
                  </span>
                </div>
              </div>

              {/* Reward Tag */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container/60">
                <span className="material-symbols-outlined text-base text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  stars
                </span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Reward: <strong className="text-primary font-bold">'Iron Grip'</strong> Exclusive Obsidian Badge &amp; +500 Bonus XP
                </span>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">Personal Progress</span>
                  <span className="text-primary font-code-stat text-code-stat font-bold">
                    {pullUpLogged ? '19' : '18'} / 30 Days Completed ({pullUpLogged ? '63%' : '60%'})
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-lowest overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container shadow-[0_0_10px_rgba(0,240,255,0.7)] transition-all duration-500"
                    style={{ width: pullUpLogged ? '63%' : '60%' }}
                  />
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  setPullUpLogged(true)
                  toast.success('+50 XP: Day 19 Pull-Ups logged to challenge!')
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-label-md text-label-md font-bold transition-all ${
                  pullUpLogged
                    ? 'bg-secondary text-on-secondary shadow-[0_0_20px_rgba(78,222,163,0.4)]'
                    : 'bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(0,240,255,0.3)] hover:shadow-[0_0_24px_rgba(0,240,255,0.5)]'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-base">{pullUpLogged ? 'task_alt' : 'check_circle'}</span>
                <span>{pullUpLogged ? 'Logged For Today (+50 XP)' : 'Log Pull-Ups Today'}</span>
              </button>
            </div>
          </div>

          {/* Challenge Card 2: Weekend 10k Step Sprint */}
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] group hover:shadow-[0_8px_28px_rgba(139,92,246,0.15)] transition-all">
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl pointer-events-none group-hover:bg-tertiary-container/20 transition-all" />
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary-fixed-dim shadow-inner">
                    <span className="material-symbols-outlined text-2xl">sprint</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Weekend 10k Step Sprint
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 font-label-sm text-label-sm font-semibold">
                        Starts in 1d 14h
                      </span>
                      <span className="font-code-stat text-code-stat text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">group</span>
                        1,840 Lifters
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container font-code-stat text-code-stat text-tertiary-fixed-dim font-bold">
                    +250 XP
                  </span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Maintain rapid tempo and hit 10,000 recorded steps per day over Saturday &amp; Sunday. Real-time accelerometer verification required.
              </p>
              {/* Action */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    setJoinedSprint(true)
                    toast.success('Registered for Weekend 10k Step Sprint!')
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-label-md text-label-md font-semibold transition-all ${
                    joinedSprint
                      ? 'bg-secondary-container/25 text-secondary'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    {joinedSprint ? 'how_to_reg' : 'person_add'}
                  </span>
                  <span>{joinedSprint ? 'Joined Challenge' : 'Join Challenge'}</span>
                </button>
                <button
                  onClick={() => toast.info('Challenge link copied to clipboard!')}
                  aria-label="Share challenge"
                  className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Badges & Trophy Cabinet Preview */}
          <div className="rounded-2xl bg-surface-container-low/90 backdrop-blur-xl p-5 flex flex-col gap-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300">military_tech</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">Parth's Trophy Cabinet</span>
              </div>
              <span className="font-code-stat text-code-stat text-primary">14 / 36 UNLOCKED</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Badge 1: Early Bird */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container transition-all group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/30 flex items-center justify-center text-amber-300 mb-2 shadow-[0_0_16px_rgba(251,191,36,0.25)] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    wb_sunny
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Early Bird</span>
                <span className="font-code-stat text-code-stat text-on-surface-variant mt-0.5">5am Workouts</span>
              </div>

              {/* Badge 2: Form Master */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container transition-all group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-secondary/20 to-primary/30 flex items-center justify-center text-secondary mb-2 shadow-[0_0_16px_rgba(78,222,163,0.25)] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    verified_user
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">Form Master</span>
                <span className="font-code-stat text-code-stat text-secondary mt-0.5">95% AI Score</span>
              </div>

              {/* Badge 3: 100kg Club */}
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-surface-container/60 hover:bg-surface-container transition-all group">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-container/20 to-primary/30 flex items-center justify-center text-primary mb-2 shadow-[0_0_16px_rgba(0,240,255,0.25)] group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    weight
                  </span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">100kg Club</span>
                <span className="font-code-stat text-code-stat text-on-surface-variant mt-0.5">Bench Press PR</span>
              </div>
            </div>

            {/* Metric Sparkline Pod */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/60 mt-1">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">XP Velocity (Last 7 Days)</span>
                <span className="font-headline-sm text-headline-sm text-secondary font-bold">+1,420 XP</span>
              </div>
              <svg className="w-28 h-8 text-secondary overflow-visible" fill="none" viewBox="0 0 120 30">
                <path
                  d="M0 24 L20 18 L40 22 L60 12 L80 16 L100 6 L120 2"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="120" cy="2" r="3.5" fill="currentColor" className="animate-ping origin-center" />
                <circle cx="120" cy="2" r="3" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
