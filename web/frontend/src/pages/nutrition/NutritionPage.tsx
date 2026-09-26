import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage, nutritionApi } from '@/lib/api'
import type { DailyNutritionSummary, DietaryPreference, MealIdea, MealLog, MealType } from '@/types'
import { toast } from '@/components/ui/Toast'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const DIETARY_PREFERENCES: DietaryPreference[] = ['anything', 'vegetarian', 'vegan', 'keto', 'paleo', 'high_protein']
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const emptyMeal = { name: '', meal_type: 'dinner' as MealType, calories: '', protein_g: '', carbs_g: '', fat_g: '' }

export default function NutritionPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(localDate(new Date()))
  const [mealFormOpen, setMealFormOpen] = useState(false)
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [barcodeOpen, setBarcodeOpen] = useState(false)
  const [meal, setMeal] = useState(emptyMeal)
  const [goalForm, setGoalForm] = useState({ target_calories: 2200, target_protein_g: 140, target_carbs_g: 220, target_fat_g: 65, dietary_preference: 'anything' as DietaryPreference })
  const [barcode, setBarcode] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<MealIdea | null>(null)
  const [recipeFilter, setRecipeFilter] = useState<'all' | 'high_protein' | 'low_carb' | 'quick'>('all')
  const [recipes, setRecipes] = useState<MealIdea[]>([])

  const summary = useQuery<DailyNutritionSummary>({
    queryKey: ['nutrition-today', date],
    queryFn: () => nutritionApi.getTodaySummary(date),
  })
  const data = summary.data
  const isToday = date === localDate(new Date())
  const macros = [
    { label: 'Calories', amount: data?.total_calories ?? 0, target: data?.goal.target_calories ?? 0, unit: 'kcal', color: 'from-error/80 to-error', icon: 'local_fire_department' },
    { label: 'Protein', amount: data?.total_protein_g ?? 0, target: data?.goal.target_protein_g ?? 0, unit: 'g', color: 'from-primary to-primary-container', icon: 'fitness_center' },
    { label: 'Carbs', amount: data?.total_carbs_g ?? 0, target: data?.goal.target_carbs_g ?? 0, unit: 'g', color: 'from-tertiary to-tertiary-fixed-dim', icon: 'grain' },
    { label: 'Fats', amount: data?.total_fat_g ?? 0, target: data?.goal.target_fat_g ?? 0, unit: 'g', color: 'from-secondary to-secondary-fixed-dim', icon: 'water_drop' },
  ]

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['nutrition-today'] })
  const logMeal = useMutation({
    mutationFn: nutritionApi.logMeal,
    onSuccess: () => { refresh(); toast.success('Meal saved. Your daily totals have been updated.'); setMealFormOpen(false); setMeal(emptyMeal) },
    onError: error => toast.error(getErrorMessage(error)),
  })
  const deleteMeal = useMutation({
    mutationFn: nutritionApi.deleteLog,
    onSuccess: () => { refresh(); toast.info('Meal removed from your log.') },
    onError: error => toast.error(getErrorMessage(error)),
  })
  const updateGoals = useMutation({
    mutationFn: nutritionApi.updateGoals,
    onSuccess: () => { refresh(); void queryClient.invalidateQueries({ queryKey: ['nutrition-goals'] }); setGoalFormOpen(false); toast.success('Daily nutrition goals updated.') },
    onError: error => toast.error(getErrorMessage(error)),
  })
  const getRecipes = useMutation({
    mutationFn: () => nutritionApi.getAiRecommendations('dinner', Math.max(100, (data?.goal.target_calories ?? 2200) - (data?.total_calories ?? 0))),
    onSuccess: result => setRecipes(result.recommendations),
    onError: error => toast.error(getErrorMessage(error)),
  })
  const lookupBarcode = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,nutriments`)
      if (!response.ok) throw new Error('Product lookup is unavailable. Try entering the nutrition values manually.')
      const result = await response.json()
      const product = result.product
      if (result.status !== 1 || !product?.product_name) throw new Error('No product found for that barcode.')
      const nutrients = product.nutriments ?? {}
      const per100 = (key: string) => Number(nutrients[`${key}_100g`] ?? nutrients[key] ?? 0)
      return { name: product.product_name, calories: Math.round(per100('energy-kcal')), protein_g: per100('proteins'), carbs_g: per100('carbohydrates'), fat_g: per100('fat') }
    },
    onSuccess: product => { setMeal({ ...emptyMeal, ...product, meal_type: 'snack', calories: String(product.calories), protein_g: String(product.protein_g), carbs_g: String(product.carbs_g), fat_g: String(product.fat_g) }); setBarcodeOpen(false); setMealFormOpen(true); toast.success('Product found. Review serving values before saving.') },
    onError: error => toast.error(getErrorMessage(error)),
  })

  const visibleRecipes = useMemo(() => recipes.filter(recipe => {
    if (recipeFilter === 'high_protein') return recipe.protein_g >= 35
    if (recipeFilter === 'low_carb') return recipe.carbs_g <= 30
    if (recipeFilter === 'quick') return recipe.prep_time_minutes <= 20
    return true
  }), [recipes, recipeFilter])

  const submitMeal = () => {
    const calories = Number(meal.calories)
    const protein = Number(meal.protein_g || 0)
    const carbs = Number(meal.carbs_g || 0)
    const fat = Number(meal.fat_g || 0)
    if (meal.name.trim().length < 2) return toast.error('Enter a meal name (at least 2 characters).')
    if (!Number.isFinite(calories) || calories < 1 || calories > 5000) return toast.error('Calories must be between 1 and 5,000.')
    if ([protein, carbs, fat].some(value => !Number.isFinite(value) || value < 0)) return toast.error('Macro values must be zero or greater.')
    logMeal.mutate({ name: meal.name.trim(), meal_type: meal.meal_type, calories, protein_g: protein, carbs_g: carbs, fat_g: fat, log_date: date })
  }

  const logRecipe = (recipe: MealIdea) => logMeal.mutate({ name: recipe.title, meal_type: recipe.meal_type, calories: recipe.calories, protein_g: recipe.protein_g, carbs_g: recipe.carbs_g, fat_g: recipe.fat_g, log_date: date })
  const openGoals = () => {
    if (data?.goal) setGoalForm({ target_calories: data.goal.target_calories, target_protein_g: data.goal.target_protein_g, target_carbs_g: data.goal.target_carbs_g, target_fat_g: data.goal.target_fat_g, dietary_preference: data.goal.dietary_preference })
    setGoalFormOpen(true)
  }

  return <main className="flex w-full flex-col gap-6 pb-16">
    <header className="flex flex-col justify-between gap-4 py-5 lg:flex-row lg:items-center">
      <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Daily fueling</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-on-surface">Nutrition & macros</h1><p className="mt-2 text-sm text-on-surface-variant">Track your meals, adjust daily targets, and get recipe ideas that fit your goals.</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setBarcodeOpen(true)} className="rounded-lg bg-surface-container-high px-4 py-2.5 font-medium text-on-surface">Scan / look up barcode</button>
        <button type="button" onClick={() => setMealFormOpen(true)} className="rounded-lg bg-primary-container px-5 py-2.5 font-bold text-on-primary-container">+ Log meal</button>
      </div>
    </header>

    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
      <div><h2 className="font-semibold text-on-surface">Meal log</h2><p className="text-sm text-on-surface-variant">{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
      <div className="flex items-center gap-2"><button type="button" aria-label="Previous day" onClick={() => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() - 1); setDate(localDate(d)) }} className="rounded-lg bg-surface-container-high px-3 py-2 text-on-surface">←</button><button type="button" disabled={isToday} onClick={() => setDate(localDate(new Date()))} className="rounded-lg bg-surface-container-high px-3 py-2 text-on-surface disabled:opacity-40">Today</button><button type="button" disabled={isToday} aria-label="Next day" onClick={() => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + 1); setDate(localDate(d)) }} className="rounded-lg bg-surface-container-high px-3 py-2 text-on-surface disabled:opacity-40">→</button><button type="button" onClick={openGoals} className="ml-2 rounded-lg bg-surface-container-high px-4 py-2 font-medium text-primary">Edit goals</button></div>
    </section>

    {summary.isLoading && <p role="status" className="rounded-xl bg-surface-container-low p-4 text-on-surface-variant">Loading nutrition data…</p>}
    {summary.isError && <div role="alert" className="rounded-xl bg-error-container/20 p-4 text-error">Nutrition data could not be loaded. <button type="button" onClick={() => void summary.refetch()} className="font-bold underline">Retry</button></div>}

    <section aria-label="Daily macro totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {macros.map(macro => {
        const progress = macro.target ? Math.min(100, Math.round(macro.amount / macro.target * 100)) : 0
        return <article key={macro.label} className="rounded-xl bg-surface-container-low p-5 shadow-md"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-on-surface-variant">Daily target</p><h2 className="font-semibold text-on-surface">{macro.label}</h2></div><span className="material-symbols-outlined text-primary">{macro.icon}</span></div><div className="mt-4 flex items-baseline justify-between gap-2"><strong className="text-3xl text-on-surface">{Math.round(macro.amount)}<small className="ml-1 text-sm font-normal">{macro.unit}</small></strong><span className="text-sm text-on-surface-variant">/ {macro.target || '—'} {macro.unit}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-highest"><div className={`h-full rounded-full bg-gradient-to-r ${macro.color} transition-all`} style={{ width: `${progress}%` }} /></div><p className="mt-2 text-right text-xs text-on-surface-variant">{macro.target ? `${progress}% • ${Math.max(0, macro.target - macro.amount).toFixed(macro.unit === 'g' ? 1 : 0)} ${macro.unit} remaining` : 'Set a target to track progress'}</p></article>
      })}
    </section>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{data?.logs.length ?? 0} meals logged</p><h2 className="mt-1 text-xl font-bold text-on-surface">Meals for this day</h2></div><span className="text-sm text-on-surface-variant">{data ? Math.max(0, data.goal.target_calories - data.total_calories) : '—'} kcal remaining</span></div>
        {data?.logs.length ? MEAL_TYPES.map(type => {
          const entries = data.logs.filter(log => log.meal_type === type)
          if (!entries.length) return null
          return <div key={type} className="rounded-xl bg-surface-container-low p-4"><h3 className="mb-2 font-semibold capitalize text-primary">{type}</h3><ul className="divide-y divide-outline-variant/30">{entries.map(log => <MealRow key={log.id} log={log} deleting={deleteMeal.isPending && deleteMeal.variables === log.id} onDelete={() => deleteMeal.mutate(log.id)} />)}</ul></div>
        }) : !summary.isLoading && <div className="rounded-xl border border-dashed border-outline-variant/50 p-8 text-center"><span className="material-symbols-outlined text-3xl text-on-surface-variant">restaurant</span><p className="mt-2 font-medium text-on-surface">No meals logged for this day</p><p className="mt-1 text-sm text-on-surface-variant">Add a meal manually, scan a packaged food barcode, or log a recipe idea.</p><button type="button" onClick={() => setMealFormOpen(true)} className="mt-4 rounded-lg bg-primary-container px-4 py-2 font-semibold text-on-primary-container">Log your first meal</button></div>}
        <div className="rounded-xl bg-surface-container-low p-4"><h3 className="font-semibold text-on-surface">Daily totals</h3><p className="mt-2 text-sm text-on-surface-variant">{data ? `${data.total_calories} kcal · ${data.total_protein_g}g protein · ${data.total_carbs_g}g carbs · ${data.total_fat_g}g fat` : '—'}</p></div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Meal inspiration</p><h2 className="mt-1 text-xl font-bold text-on-surface">Recipe ideas</h2></div><button type="button" disabled={getRecipes.isPending} onClick={() => getRecipes.mutate()} className="rounded-lg bg-primary-container px-3 py-2 text-sm font-bold text-on-primary-container disabled:opacity-50">{getRecipes.isPending ? 'Finding…' : 'Get ideas'}</button></div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Recipe filters">{(['all', 'high_protein', 'low_carb', 'quick'] as const).map(filter => <button key={filter} type="button" aria-pressed={recipeFilter === filter} onClick={() => setRecipeFilter(filter)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${recipeFilter === filter ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface'}`}>{({ all: 'All', high_protein: 'High protein', low_carb: 'Low carb', quick: '≤20 min' })[filter]}</button>)}</div>
          {getRecipes.isError && <p role="alert" className="mt-3 text-sm text-error">Could not get recipe ideas. Try again.</p>}
          {!recipes.length && <p className="mt-4 text-sm text-on-surface-variant">Generate ideas matched to your calorie budget and dietary preference.</p>}
          <div className="mt-3 flex flex-col gap-3">{visibleRecipes.map(recipe => <article key={recipe.title} className="rounded-lg bg-surface-container p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-on-surface">{recipe.title}</h3><p className="mt-1 text-xs text-on-surface-variant">{recipe.calories} kcal · P {recipe.protein_g}g · C {recipe.carbs_g}g · F {recipe.fat_g}g · {recipe.prep_time_minutes} min</p></div><button type="button" aria-label={`Show ingredients for ${recipe.title}`} onClick={() => setSelectedRecipe(selectedRecipe?.title === recipe.title ? null : recipe)} className="text-sm text-primary underline">{selectedRecipe?.title === recipe.title ? 'Hide' : 'Details'}</button></div>{selectedRecipe?.title === recipe.title && <div className="mt-3 border-t border-outline-variant/30 pt-3"><p className="text-sm text-on-surface-variant">{recipe.description}</p><ul className="mt-2 list-disc pl-5 text-sm text-on-surface-variant">{recipe.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul></div>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-on-surface-variant">{recipe.dietary_tags.join(' · ')}</span><button type="button" disabled={logMeal.isPending} onClick={() => logRecipe(recipe)} className="rounded-lg bg-primary-container/15 px-3 py-1.5 text-sm font-semibold text-primary disabled:opacity-50">Log as {recipe.meal_type}</button></div></article>)}</div>
          {recipes.length > 0 && visibleRecipes.length === 0 && <p className="mt-4 text-sm text-on-surface-variant">No recipes match this filter. Choose another filter.</p>}
        </div>
        <div className="rounded-xl bg-surface-container-low p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Preferences</p><h2 className="mt-1 font-semibold text-on-surface">Daily targets</h2></div><button type="button" onClick={openGoals} className="text-sm font-semibold text-primary underline">Edit</button></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{macros.map(macro => <div key={macro.label}><dt className="text-on-surface-variant">{macro.label}</dt><dd className="font-semibold text-on-surface">{macro.target || '—'} {macro.unit}</dd></div>)}<div><dt className="text-on-surface-variant">Diet</dt><dd className="font-semibold capitalize text-on-surface">{data?.goal.dietary_preference?.replace('_', ' ') ?? '—'}</dd></div></dl></div>
      </section>
    </div>

    {mealFormOpen && <Modal title="Log a meal" onClose={() => setMealFormOpen(false)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Meal name" className="sm:col-span-2"><input autoFocus required minLength={2} maxLength={200} value={meal.name} onChange={event => setMeal({ ...meal, name: event.target.value })} placeholder="e.g. Chicken and rice bowl" /></Field><Field label="Meal type"><select value={meal.meal_type} onChange={event => setMeal({ ...meal, meal_type: event.target.value as MealType })}>{MEAL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></Field><Field label="Calories (kcal)"><input required type="number" min="1" max="5000" value={meal.calories} onChange={event => setMeal({ ...meal, calories: event.target.value })} /></Field><Field label="Protein (g)"><input type="number" min="0" step="0.1" value={meal.protein_g} onChange={event => setMeal({ ...meal, protein_g: event.target.value })} /></Field><Field label="Carbohydrates (g)"><input type="number" min="0" step="0.1" value={meal.carbs_g} onChange={event => setMeal({ ...meal, carbs_g: event.target.value })} /></Field><Field label="Fat (g)"><input type="number" min="0" step="0.1" value={meal.fat_g} onChange={event => setMeal({ ...meal, fat_g: event.target.value })} /></Field></div><p className="mt-3 text-xs text-on-surface-variant">Logging for {date}. Nutrition values are estimates unless taken from a product label.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setMealFormOpen(false)} className="rounded-lg bg-surface-container-high px-4 py-2 text-on-surface">Cancel</button><button type="button" disabled={logMeal.isPending} onClick={submitMeal} className="rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary-container disabled:opacity-50">{logMeal.isPending ? 'Saving…' : 'Save meal'}</button></div></Modal>}

    {goalFormOpen && <Modal title="Daily nutrition goals" onClose={() => setGoalFormOpen(false)}><div className="grid gap-4 sm:grid-cols-2">{([['target_calories', 'Calories (kcal)', 800, 10000], ['target_protein_g', 'Protein (g)', 0, 500], ['target_carbs_g', 'Carbohydrates (g)', 0, 1000], ['target_fat_g', 'Fat (g)', 0, 300]] as const).map(([key, label, min, max]) => <Field key={key} label={label}><input type="number" min={min} max={max} value={goalForm[key]} onChange={event => setGoalForm({ ...goalForm, [key]: Number(event.target.value) })} /></Field>)}<Field label="Dietary preference" className="sm:col-span-2"><select value={goalForm.dietary_preference} onChange={event => setGoalForm({ ...goalForm, dietary_preference: event.target.value as DietaryPreference })}>{DIETARY_PREFERENCES.map(value => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></Field></div><p className="mt-3 text-xs text-on-surface-variant">Targets are personal tracking goals, not medical advice. Consult a qualified professional for individualized nutrition guidance.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setGoalFormOpen(false)} className="rounded-lg bg-surface-container-high px-4 py-2 text-on-surface">Cancel</button><button type="button" disabled={updateGoals.isPending} onClick={() => updateGoals.mutate(goalForm)} className="rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary-container disabled:opacity-50">{updateGoals.isPending ? 'Saving…' : 'Save goals'}</button></div></Modal>}

    {barcodeOpen && <Modal title="Look up packaged food" onClose={() => setBarcodeOpen(false)}><p className="text-sm text-on-surface-variant">Enter the product barcode to look it up in Open Food Facts. Values are typically per 100g; check the serving size and edit before logging.</p><form className="mt-4 flex gap-2" onSubmit={event => { event.preventDefault(); if (barcode.trim()) lookupBarcode.mutate(barcode.trim()) }}><input autoFocus inputMode="numeric" pattern="[0-9]{8,14}" required maxLength={14} value={barcode} onChange={event => setBarcode(event.target.value.replace(/\D/g, ''))} placeholder="Barcode digits" aria-label="Product barcode" className="min-w-0 flex-1 rounded-lg bg-surface-container px-3 py-2 text-on-surface" /><button type="submit" disabled={lookupBarcode.isPending} className="rounded-lg bg-primary-container px-4 py-2 font-bold text-on-primary-container disabled:opacity-50">{lookupBarcode.isPending ? 'Looking up…' : 'Look up'}</button></form><p className="mt-3 text-xs text-on-surface-variant">Barcode lookup requires an internet connection and sends only the barcode to Open Food Facts.</p></Modal>}
  </main>
}

function MealRow({ log, deleting, onDelete }: { log: MealLog; deleting: boolean; onDelete: () => void }) {
  return <li className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-medium text-on-surface">{log.name}</p><p className="mt-0.5 text-xs text-on-surface-variant">{new Date(log.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {log.calories} kcal · P {log.protein_g}g · C {log.carbs_g}g · F {log.fat_g}g</p></div><button type="button" disabled={deleting} aria-label={`Delete ${log.name}`} onClick={onDelete} className="rounded-lg p-2 text-on-surface-variant hover:bg-error-container/20 hover:text-error disabled:opacity-40"><span className="material-symbols-outlined">delete</span></button></li>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-on-surface">{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high"><span className="material-symbols-outlined">close</span></button></div>{children}</section></div>
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`flex flex-col gap-1.5 text-sm font-medium text-on-surface-variant ${className}`}>{label}<div className="nutrition-input">{children}</div></label>
}
