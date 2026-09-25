import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Dumbbell, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, difficultyColor } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'

const CATEGORIES = ['', 'strength', 'cardio', 'hiit', 'yoga', 'flexibility', 'balance', 'rehabilitation']
const DIFFICULTIES = ['', 'beginner', 'intermediate', 'advanced']

export default function ExercisesPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['exercises', page, category, difficulty, search],
    queryFn: () => api.get('/exercises', {
      params: { page, page_size: 20, category: category || undefined, difficulty: difficulty || undefined, search: search || undefined },
    }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const exercises = data?.items ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
        <p className="text-gray-400 text-sm mt-1">{data?.total ?? '–'} exercises available</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search exercises…"
            className="input w-full pl-9"
            aria-label="Search exercises"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1) }}
            className="input"
            aria-label="Filter by category"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All categories'}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={e => { setDifficulty(e.target.value); setPage(1) }}
            className="input"
            aria-label="Filter by difficulty"
          >
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>{d ? d.charAt(0).toUpperCase() + d.slice(1) : 'All levels'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : isError ? (
        <EmptyState
          icon={Filter}
          title="Couldn't load exercises"
          description="Check your connection and try again"
        />
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No exercises found"
          description="Try adjusting your filters"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex: any) => (
            <Link
              key={ex.id}
              to={`/exercises/${ex.id}`}
              className="card p-4 hover:border-primary-500/40 transition-all group focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                    {ex.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{ex.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 flex-shrink-0 mt-0.5 transition-colors" aria-hidden="true" />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={cn('badge', difficultyColor(ex.difficulty))}>
                  {ex.difficulty}
                </span>
                <span className="badge bg-surface-600 text-gray-300">{ex.category}</span>
                {ex.supports_pose_analysis && (
                  <span className="badge bg-accent-500/20 text-accent-300">Pose AI</span>
                )}
                {ex.is_bodyweight && (
                  <span className="badge bg-emerald-500/20 text-emerald-300">Bodyweight</span>
                )}
              </div>

              {ex.primary_muscles?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {ex.primary_muscles.slice(0, 3).join(', ')}
                  {ex.primary_muscles.length > 3 && ' +more'}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3" role="navigation" aria-label="Pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost disabled:opacity-40"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {data.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="btn-ghost disabled:opacity-40"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
