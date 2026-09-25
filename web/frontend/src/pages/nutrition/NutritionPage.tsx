import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nutritionApi, getErrorMessage } from '@/lib/api'
import { DailyNutritionSummary, MealIdea, MealLog } from '@/types'
import { toast } from '@/components/ui/Toast'

export default function NutritionPage() {
  const qc = useQueryClient()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'high_protein' | 'low_carb' | 'quick'>('all')

  // Log Form State
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('dinner')
  const [calories, setCalories] = useState(510)
  const [protein, setProtein] = useState(42)
  const [carbs, setCarbs] = useState(15)
  const [fat, setFat] = useState(22)

  const { data: summary } = useQuery<DailyNutritionSummary>({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getTodaySummary(),
  })

  const logMealMutation = useMutation({
    mutationFn: nutritionApi.logMeal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-today'] })
      toast.success('Meal logged into metabolic telemetry!')
      setIsLogModalOpen(false)
      setMealName('')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMealMutation = useMutation({
    mutationFn: nutritionApi.deleteLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-today'] })
      toast.info('Meal record removed.')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleQuickLogRecipe = (name: string, cal: number, p: number, c: number, f: number) => {
    logMealMutation.mutate({
      name,
      meal_type: 'dinner',
      calories: cal,
      protein_g: p,
      carbs_g: c,
      fat_g: f,
    })
  }

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Command & Telemetry Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Smart Nutrition & Metabolic Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-primary font-code-stat text-code-stat">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse" />
              REAL-TIME
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/15 text-secondary">
              <span className="material-symbols-outlined text-sm">sync_saved_locally</span>
              <span className="font-label-sm text-label-sm">Metabolic Sync Active • Connected to Apple Health / Oura Ring (2m ago)</span>
            </div>
            <span className="text-on-surface-variant font-body-sm text-body-sm hidden md:inline">•</span>
            <span className="text-on-surface-variant font-code-stat text-code-stat">Basal Metabolic Rate: 1,940 kcal</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            onClick={() => toast.info('Barcode scanner active: point camera at nutrition label')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-primary">barcode_scanner</span>
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_28px_rgba(0,240,255,0.55)] transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-lg leading-none">add</span>
            <span>+ Quick Log Meal</span>
          </button>
        </div>
      </div>

      {/* Bento Macro KPI Cards (4 Column Grid) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* 1. Calories / Energy */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] group hover:bg-surface-container transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-error-container/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-error-container/25 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">Energy Target</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Calories</span>
              </div>
            </div>
            <span className="font-code-stat text-code-stat text-error font-bold px-2 py-0.5 rounded bg-error-container/20">77%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-stat-xl text-stat-xl text-on-surface tracking-tight">1,850</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 2,400 kcal</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">550 left</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-error/80 to-error transition-all duration-700" style={{ width: '77%' }} />
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 text-on-surface-variant font-code-stat text-code-stat">
            <span>Burn: 2,610 kcal</span>
            <span className="text-secondary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-xs">trending_down</span>-760 deficit
            </span>
          </div>
        </div>

        {/* 2. Protein */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] group hover:bg-surface-container transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-primary-container/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  fitness_center
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">Hypertrophy Goal</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Protein</span>
              </div>
            </div>
            <span className="font-code-stat text-code-stat text-primary-container font-bold px-2 py-0.5 rounded bg-primary-container/15">83%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-stat-xl text-stat-xl text-primary tracking-tight">
                145<span className="text-headline-md font-headline-md">g</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 175g</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">30g needed</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full rounded-full bg-primary-container shadow-[0_0_12px_rgba(0,240,255,0.7)] transition-all duration-700" style={{ width: '83%' }} />
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 text-on-surface-variant font-code-stat text-code-stat">
            <span>2.1g / kg bodyweight</span>
            <span className="text-primary-container font-semibold">Optimal</span>
          </div>
        </div>

        {/* 3. Carbohydrates */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] group hover:bg-surface-container transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-tertiary-container/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed-dim/20 flex items-center justify-center text-tertiary-fixed-dim">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  grain
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">Glycogen Re-load</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Carbs</span>
              </div>
            </div>
            <span className="font-code-stat text-code-stat text-tertiary-fixed-dim font-bold px-2 py-0.5 rounded bg-tertiary-container/15">76%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-stat-xl text-stat-xl text-tertiary tracking-tight">
                190<span className="text-headline-md font-headline-md">g</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 250g</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">60g left</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full rounded-full bg-tertiary-fixed-dim transition-all duration-700" style={{ width: '76%' }} />
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 text-on-surface-variant font-code-stat text-code-stat">
            <span>Fiber: 31g / 38g</span>
            <span className="text-tertiary-fixed-dim font-semibold">Low Glycemic</span>
          </div>
        </div>

        {/* 4. Lipids / Fats */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-5 shadow-[0_4px_24px_rgba(0,0,0,0.45)] group hover:bg-surface-container transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-secondary-container/20 to-transparent rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shield
                </span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">Hormonal Health</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">Fats / Lipids</span>
              </div>
            </div>
            <span className="font-code-stat text-code-stat text-secondary font-bold px-2 py-0.5 rounded bg-secondary-container/15">78%</span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-stat-xl text-stat-xl text-secondary tracking-tight">
                55<span className="text-headline-md font-headline-md">g</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">/ 70g</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">15g left</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: '78%' }} />
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 text-on-surface-variant font-code-stat text-code-stat">
            <span>Mono/Poly: 82%</span>
            <span className="text-secondary font-semibold">Clean Profile</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Content Split (60% / 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Meal Timeline (60% -> 7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <h2 className="font-headline-md text-headline-md text-on-surface">Today's Meal Timeline</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-code-stat text-code-stat">
                3 Logged • 550 kcal remaining
              </span>
            </div>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-base">restaurant</span>
              <span>+ Add Meal</span>
            </button>
          </div>

          {/* Meal Card 1: Breakfast */}
          <div className="group relative rounded-xl bg-surface-container-low p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] transition-all hover:bg-surface-container">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-xl">wb_twilight</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">08:30</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">Breakfast</span>
                    <span className="text-on-surface-variant text-xs">•</span>
                    <span className="font-code-stat text-code-stat text-on-surface-variant">Post-Morning Cardio</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Oatmeal & Whey Protein Shake</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Rolled oats (80g), Isolate Whey Vanilla (35g), Almond Milk, Blueberries & Chia seeds
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  520 <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">kcal</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 bg-surface-container-lowest/40 -mx-5 -mb-5 px-5 py-2.5 rounded-b-xl">
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="text-on-surface-variant">Protein:</span>
                <span className="text-primary font-bold">42g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                <span className="text-on-surface-variant">Carbs:</span>
                <span className="text-on-surface font-bold">65g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface-variant">Fats:</span>
                <span className="text-on-surface font-bold">10g</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-secondary font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-xs">verified</span>
                <span>Verified AI Bio-Scan</span>
              </div>
            </div>
          </div>

          {/* Meal Card 2: Lunch */}
          <div className="group relative rounded-xl bg-surface-container-low p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] transition-all hover:bg-surface-container">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-xl">wb_sunny</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">13:15</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">Lunch</span>
                    <span className="text-on-surface-variant text-xs">•</span>
                    <span className="font-code-stat text-code-stat text-on-surface-variant">Satiety Index: 9.2</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Grilled Chicken Quinoa Bowl</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Free-range chicken breast (200g), tri-color quinoa, roasted broccoli, avocado, tahini drizzle
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  680 <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">kcal</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 bg-surface-container-lowest/40 -mx-5 -mb-5 px-5 py-2.5 rounded-b-xl">
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="text-on-surface-variant">Protein:</span>
                <span className="text-primary font-bold">58g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                <span className="text-on-surface-variant">Carbs:</span>
                <span className="text-on-surface font-bold">72g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface-variant">Fats:</span>
                <span className="text-on-surface font-bold">18g</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-primary-container font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>Pre-Workout Peak</span>
              </div>
            </div>
          </div>

          {/* Meal Card 3: Afternoon Snack */}
          <div className="group relative rounded-xl bg-surface-container-low p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.5)] transition-all hover:bg-surface-container">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl">energy_savings_leaf</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">16:45</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary-fixed-dim">Afternoon Snack</span>
                    <span className="text-on-surface-variant text-xs">•</span>
                    <span className="font-code-stat text-code-stat text-on-surface-variant">Metabolic Stimulus</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Greek Yogurt & Wild Berries</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Non-fat Greek Yogurt 0% (220g), wild blackberries, organic raw honey (1 tsp)
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  250 <span className="font-label-sm text-label-sm font-normal text-on-surface-variant">kcal</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 bg-surface-container-lowest/40 -mx-5 -mb-5 px-5 py-2.5 rounded-b-xl">
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="text-on-surface-variant">Protein:</span>
                <span className="text-primary font-bold">24g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
                <span className="text-on-surface-variant">Carbs:</span>
                <span className="text-on-surface font-bold">28g</span>
              </div>
              <div className="flex items-center gap-1.5 font-code-stat text-code-stat">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface-variant">Fats:</span>
                <span className="text-on-surface font-bold">4g</span>
              </div>
              <div className="ml-auto flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-xs">local_fire_department</span>
                <span>Low Fat</span>
              </div>
            </div>
          </div>

          {/* Dynamic User Logs if present */}
          {summary?.logs && summary.logs.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Additional Custom Logs</span>
              {summary.logs.map((log: MealLog) => (
                <div key={log.id} className="rounded-xl bg-surface-container p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-label-sm text-label-sm text-primary uppercase">{log.meal_type}</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">{log.name}</span>
                    </div>
                    <span className="font-code-stat text-code-stat text-on-surface-variant mt-0.5">
                      {log.calories} kcal • P: {log.protein_g}g • C: {log.carbs_g}g • F: {log.fat_g}g
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMealMutation.mutate(log.id)}
                    className="p-1.5 rounded hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Meal Card 4: Dinner Slot (Open) */}
          <div className="relative rounded-xl bg-surface-container-low/70 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">dinner_dining</span>
              </div>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Slot: 20:00 - 21:00</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container/15 text-primary font-code-stat text-code-stat">
                    Target: 510-550 kcal
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">Dinner Slot Open</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Targeting 30g+ protein to complete daily synthesis threshold.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleQuickLogRecipe('Seared Salmon & Lemon Asparagus', 510, 42, 8, 29)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-primary font-label-md text-label-md font-semibold transition-all flex items-center justify-center gap-2 shrink-0"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Auto-fill from AI Chef</span>
            </button>
          </div>

          {/* Quick Nutrition Balance Micro-Insights */}
          <div className="rounded-xl bg-surface-container-low p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">insights</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Metabolic Prediction</span>
                <p className="font-body-sm text-body-sm text-on-surface">
                  Consuming dinner with &gt;40g protein before 20:30 optimizes overnight recovery window by 18%.
                </p>
              </div>
            </div>
            <span className="font-code-stat text-code-stat text-secondary shrink-0 font-semibold">HRV Impact: +14ms</span>
          </div>
        </section>

        {/* RIGHT COLUMN: AI Chef & Recipe Recommendations (40% -> 5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-5">
          {/* Section Header & Filter Pills */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">AI Chef Engine</h2>
              </div>
              <span className="font-code-stat text-code-stat text-primary-container bg-primary-container/10 px-2.5 py-1 rounded-full">
                v4.2 Bio-Tuned
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setRecipeFilter('all')}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 transition-all ${
                  recipeFilter === 'all'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                }`}
                type="button"
              >
                All Matches
              </button>
              <button
                onClick={() => setRecipeFilter('high_protein')}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 transition-all ${
                  recipeFilter === 'high_protein'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                }`}
                type="button"
              >
                High Protein (35g+)
              </button>
              <button
                onClick={() => setRecipeFilter('low_carb')}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 transition-all ${
                  recipeFilter === 'low_carb'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                }`}
                type="button"
              >
                Low Carb
              </button>
              <button
                onClick={() => setRecipeFilter('quick')}
                className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 transition-all ${
                  recipeFilter === 'quick'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(0,240,255,0.35)]'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface'
                }`}
                type="button"
              >
                &lt; 20 Min Prep
              </button>
            </div>
          </div>

          {/* Highlight Recipe Card: Seared Salmon with Lemon Asparagus */}
          <div className="rounded-xl bg-surface-container-low overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col group">
            <div className="relative w-full h-48 overflow-hidden">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt="Seared Salmon"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnj3CnrOeQm-qOjJ_-kBCbleswtBwEqsjz3mfnCF7TSO2Cb_HUo6dGQetLDAp7EFKXEVKvhZh5WgDJASv5-gY5HVNnYEILJC0tg7zmPRAM1xAulkYHkX4eFWgHOuiQlWgSrPgYQwaGovWGY4oiUAMhhgk-meepILuDDlOCbtA1r5BowsO-qUCTDOsPyGvcqhMMSSz2ymDz3Mx3aqD65mA4MZg_5p5-dzF8e3r8c6Mhjfhu2Z1VONioKA"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/40 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-primary font-code-stat text-code-stat font-bold">
                  #keto
                </span>
                <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary font-code-stat text-code-stat font-bold">
                  #omega3
                </span>
              </div>
              <div className="absolute top-3 right-3 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-primary-container">timer</span>
                <span className="font-code-stat text-code-stat text-on-surface">20 min prep</span>
              </div>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                    Top Bio-Optimal Pick
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface leading-tight">
                    Seared Salmon & Lemon Asparagus
                  </h3>
                </div>
                <div className="text-right">
                  <span className="font-headline-md text-headline-md text-primary font-bold">510</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block -mt-1">kcal</span>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-surface-container-high/60 text-center">
                <div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant uppercase block">Protein</span>
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">42g</span>
                </div>
                <div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant uppercase block">Carbs</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">8g</span>
                </div>
                <div>
                  <span className="font-code-stat text-code-stat text-on-surface-variant uppercase block">Fats</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-bold">29g</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Engineered Ingredients
                  </span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">4 Items • In Pantry</span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-body-sm text-body-sm">
                  <div className="flex items-center gap-2 text-on-surface p-1.5 rounded bg-surface-container-high/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    <span>Atlantic Salmon (220g)</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface p-1.5 rounded bg-surface-container-high/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    <span>Fresh Asparagus (150g)</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface p-1.5 rounded bg-surface-container-high/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                    <span>Cold Olive Oil (10ml)</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface p-1.5 rounded bg-surface-container-high/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-error" />
                    <span>Fresh Lemon & Dill</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <button
                  onClick={() => handleQuickLogRecipe('Seared Salmon & Lemon Asparagus', 510, 42, 8, 29)}
                  className="flex-1 py-3 px-4 rounded-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_18px_rgba(0,240,255,0.35)] hover:shadow-[0_0_24px_rgba(0,240,255,0.55)] transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Log This Meal (Dinner)</span>
                </button>
                <button
                  onClick={() => toast.info('Step 1: Pan sear salmon skin-down for 5 mins. Step 2: Sauté asparagus in olive oil with lemon.')}
                  className="py-3 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1.5"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">menu_book</span>
                  <span>Instructions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Recipe Recommendation */}
          <div className="rounded-xl bg-surface-container-low p-4 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] flex items-center justify-between gap-4 group hover:bg-surface-container transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-container-high relative">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  alt="Turkey Wrap"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCM9LOgbLBHYsX0HWj0An43yKSd-OZhEzzFnpuAQSGy6WduL6v6buZ4ifsxAfpjMcHcnu_eLRKDwCIQxalF2rR4A9ZlRLNYt7U9Iza4ejXLxDbjjFIp5uunctouskdXSpNLuV_Hg-rAWvAyeBs8-SdOEglOk_yqTNrfF7IHP1vGMkE7_uMndSOZEONJiXKuRON0bpkLFMPb4FJAVdjpLLQ0qgFWnaxG_gOSqwnhu7zNAt3JrUqmLwm_IQ"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-code-stat text-code-stat text-secondary font-bold">10 min prep</span>
                  <span className="text-on-surface-variant text-xs">•</span>
                  <span className="font-code-stat text-code-stat text-on-surface-variant">440 kcal</span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface text-base">Turkey & Avocado Power Wrap</h4>
                <div className="flex items-center gap-2 mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <span className="text-primary font-bold">P: 36g</span>
                  <span>•</span>
                  <span>C: 38g</span>
                  <span>•</span>
                  <span>F: 14g</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleQuickLogRecipe('Turkey & Avocado Power Wrap', 440, 36, 38, 14)}
              aria-label="Quick add Turkey Wrap"
              className="w-10 h-10 rounded-lg bg-surface-container-high hover:bg-primary-container hover:text-on-primary-container text-primary flex items-center justify-center shrink-0 transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>

          {/* Micronutrient Breakdown Mini Card */}
          <div className="rounded-xl bg-surface-container-low p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">biotech</span>
                <span className="font-headline-sm text-headline-sm text-sm uppercase tracking-wider text-on-surface">
                  Target Micronutrients
                </span>
              </div>
              <span className="font-code-stat text-code-stat text-secondary">RDA Status</span>
            </div>
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between items-center font-body-sm text-body-sm mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                    Omega-3 Fatty Acids (EPA/DHA)
                  </span>
                  <span className="font-code-stat text-code-stat text-primary font-bold">110%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full bg-primary-container shadow-[0_0_8px_rgba(0,240,255,0.6)]" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center font-body-sm text-body-sm mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    Vitamin D3 (Synthesis + Diet)
                  </span>
                  <span className="font-code-stat text-code-stat text-secondary font-bold">95%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full bg-secondary" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center font-body-sm text-body-sm mb-1">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim" />
                    Magnesium Glycinate
                  </span>
                  <span className="font-code-stat text-code-stat text-tertiary-fixed-dim font-bold">80%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <div className="h-full rounded-full bg-tertiary-fixed-dim" style={{ width: '80%' }} />
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => toast.info('Full 28-Biomarker Matrix: Zinc 98%, Iron 104%, B12 120%, Potassium 88%')}
                className="text-on-surface-variant hover:text-primary font-code-stat text-code-stat transition-colors inline-flex items-center gap-1"
                type="button"
              >
                <span>View Full 28-Biomarker Matrix</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* QUICK LOG MEAL MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low p-6 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(0,240,255,0.2)] border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">restaurant</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Log Meal to Telemetry</h3>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Meal Name</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="e.g. Grass-fed Ribeye & Sweet Potato"
                  className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Meal Slot</label>
                  <select
                    value={mealType}
                    onChange={e => setMealType(e.target.value)}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snack">Snack</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={e => setCalories(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-label-sm text-label-sm text-primary uppercase">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={e => setProtein(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-tertiary-fixed-dim uppercase">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={e => setCarbs(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-secondary uppercase">Fats (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={e => setFat(Number(e.target.value))}
                    className="w-full mt-1 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface font-label-md text-label-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!mealName.trim()) {
                    toast.error('Please enter a meal description')
                    return
                  }
                  logMealMutation.mutate({
                    name: mealName,
                    meal_type: mealType,
                    calories,
                    protein_g: protein,
                    carbs_g: carbs,
                    fat_g: fat,
                  })
                }}
                className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(0,240,255,0.4)] hover:shadow-[0_0_24px_rgba(0,240,255,0.6)]"
              >
                Confirm & Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
