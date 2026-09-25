import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Utensils, Plus, Trash2, Sparkles, Flame, ShieldAlert, Clock, ChefHat, Check } from 'lucide-react'
import { nutritionApi, getErrorMessage } from '@/lib/api'
import { DailyNutritionSummary, MealIdea, MealLog } from '@/types'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

export default function NutritionPage() {
  const qc = useQueryClient()
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'ai-ideas'>('today')

  // Log Form State
  const [mealName, setMealName] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [calories, setCalories] = useState(450)
  const [protein, setProtein] = useState(30)
  const [carbs, setCarbs] = useState(45)
  const [fat, setFat] = useState(12)

  const { data: summary, isLoading } = useQuery<DailyNutritionSummary>({
    queryKey: ['nutrition-today'],
    queryFn: () => nutritionApi.getTodaySummary(),
  })

  const { data: aiIdeas, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-meal-ideas'],
    queryFn: () => nutritionApi.getAiRecommendations('lunch', 700),
    enabled: activeTab === 'ai-ideas',
  })

  const logMealMutation = useMutation({
    mutationFn: nutritionApi.logMeal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-today'] })
      toast.success('Meal logged successfully!')
      setIsLogModalOpen(false)
      setMealName('')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const deleteMealMutation = useMutation({
    mutationFn: nutritionApi.deleteLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-today'] })
      toast.info('Logged meal removed.')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const handleQuickLogIdea = (idea: MealIdea) => {
    logMealMutation.mutate({
      name: idea.title,
      meal_type: idea.meal_type,
      calories: idea.calories,
      protein_g: idea.protein_g,
      carbs_g: idea.carbs_g,
      fat_g: idea.fat_g,
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  const goal = summary?.goal || { target_calories: 2200, target_protein_g: 140, target_carbs_g: 220, target_fat_g: 65 }
  const totalCal = summary?.total_calories || 0
  const totalP = summary?.total_protein_g || 0
  const totalC = summary?.total_carbs_g || 0
  const totalF = summary?.total_fat_g || 0

  const pPct = Math.min(100, Math.round((totalP / goal.target_protein_g) * 100))
  const cPct = Math.min(100, Math.round((totalC / goal.target_carbs_g) * 100))
  const fPct = Math.min(100, Math.round((totalF / goal.target_fat_g) * 100))
  const calPct = Math.min(100, Math.round((totalCal / goal.target_calories) * 100))

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-primary-400" /> AI Nutrition & Macro Tracker
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Fuel your fitness goals with real-time macro tracking and personalized AI meal suggestions.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Log Meal
        </button>
      </div>

      {/* Macro Target Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Calories */}
        <div className="card p-4 space-y-2 border border-surface-800 bg-surface-900/80">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Calories</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {totalCal} <span className="text-xs text-gray-400 font-normal">/ {goal.target_calories} kcal</span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
            <div className="bg-amber-400 h-2 rounded-full transition-all duration-500" style={{ width: `${calPct}%` }} />
          </div>
        </div>

        {/* Protein */}
        <div className="card p-4 space-y-2 border border-surface-800 bg-surface-900/80">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Protein</span>
            <span className="text-xs font-semibold text-primary-400">{pPct}%</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalP}g <span className="text-xs text-gray-400 font-normal">/ {goal.target_protein_g}g</span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{ width: `${pPct}%` }} />
          </div>
        </div>

        {/* Carbs */}
        <div className="card p-4 space-y-2 border border-surface-800 bg-surface-900/80">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Carbs</span>
            <span className="text-xs font-semibold text-cyan-400">{cPct}%</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalC}g <span className="text-xs text-gray-400 font-normal">/ {goal.target_carbs_g}g</span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
            <div className="bg-cyan-400 h-2 rounded-full transition-all duration-500" style={{ width: `${cPct}%` }} />
          </div>
        </div>

        {/* Fats */}
        <div className="card p-4 space-y-2 border border-surface-800 bg-surface-900/80">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Fats</span>
            <span className="text-xs font-semibold text-emerald-400">{fPct}%</span>
          </div>
          <div className="text-xl font-bold text-white">
            {totalF}g <span className="text-xs text-gray-400 font-normal">/ {goal.target_fat_g}g</span>
          </div>
          <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-400 h-2 rounded-full transition-all duration-500" style={{ width: `${fPct}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-800">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'today'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Today's Meals ({summary?.logs.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('ai-ideas')}
          className={`px-4 py-2.5 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ai-ideas'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" /> AI Recipe Ideas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' ? (
        <div className="space-y-4">
          {summary?.logs.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <Utensils className="w-10 h-10 mx-auto text-surface-600 opacity-60" />
              <p className="font-semibold text-white">No meals logged for today</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Log your meals to track your daily calorie and macronutrient targets accurately.
              </p>
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log First Meal
              </button>
            </div>
          ) : (
            <div className="divide-y divide-surface-800 rounded-xl bg-surface-900 border border-surface-800 overflow-hidden">
              {summary?.logs.map((log: MealLog) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-surface-850/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-semibold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                        {log.meal_type}
                      </span>
                      <h4 className="font-medium text-white text-sm">{log.name}</h4>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span>{log.calories} kcal</span>
                      <span>•</span>
                      <span>P: {log.protein_g}g</span>
                      <span>C: {log.carbs_g}g</span>
                      <span>F: {log.fat_g}g</span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMealMutation.mutate(log.id)}
                    disabled={deleteMealMutation.isPending}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-surface-800"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {aiLoading ? (
            <div className="py-12 text-center"><LoadingSpinner /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {aiIdeas?.recommendations.map((idea: MealIdea, idx: number) => (
                <div key={idx} className="card p-5 space-y-3 border border-surface-800 bg-surface-900/90 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <ChefHat className="w-3 h-3" /> {idea.meal_type}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {idea.prep_time_minutes} min prep
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-base">{idea.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{idea.description}</p>

                    <div className="flex items-center gap-2 pt-1">
                      {idea.dietary_tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] text-surface-300 bg-surface-800 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-800 flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-300">
                      <span className="text-white font-bold">{idea.calories}</span> kcal | P:{idea.protein_g}g C:{idea.carbs_g}g F:{idea.fat_g}g
                    </div>

                    <button
                      onClick={() => handleQuickLogIdea(idea)}
                      disabled={logMealMutation.isPending}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Entry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Meal Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 space-y-4 bg-surface-900 border border-surface-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-400" /> Log Meal Entry
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Protein Smoothie"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Meal Type</label>
                  <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="input w-full">
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-800">
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="btn-ghost text-xs px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!mealName.trim() || logMealMutation.isPending}
                onClick={() =>
                  logMealMutation.mutate({
                    name: mealName,
                    meal_type: mealType,
                    calories,
                    protein_g: protein,
                    carbs_g: carbs,
                    fat_g: fat,
                  })
                }
                className="btn-primary text-xs px-4 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Log Meal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
