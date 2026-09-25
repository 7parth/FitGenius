import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api } from '@/lib/api'
import { cn, difficultyColor } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function ExercisesAdminPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exercises', page, search],
    queryFn: () => api.get('/exercises', { params: { page, page_size: 30, search: search || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/exercises/${id}`, { is_active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-exercises'] }),
  })

  const exercises: any[] = data?.items ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total ?? '–'} exercises</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search exercises…"
          className="input w-full pl-9"
          aria-label="Search exercises"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" aria-label="Exercise library admin table">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Difficulty</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Pose AI</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex: any) => (
                <tr key={ex.id} className="border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20">
                  <td className="p-4">
                    <p className="font-medium text-white">{ex.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-xs">{ex.slug}</p>
                  </td>
                  <td className="p-4 text-gray-400 hidden sm:table-cell capitalize">{ex.category}</td>
                  <td className="p-4">
                    <span className={cn('text-xs font-medium capitalize', difficultyColor(ex.difficulty))}>
                      {ex.difficulty}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    {ex.supports_pose_analysis
                      ? <span className="badge bg-accent-500/20 text-accent-300 text-xs">Yes</span>
                      : <span className="text-gray-600 text-xs">–</span>
                    }
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        if (window.confirm(`Deactivate "${ex.name}"?`)) deactivateMutation.mutate(ex.id)
                      }}
                      className="btn-ghost p-1.5"
                      aria-label={`Deactivate ${ex.name}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3" role="navigation" aria-label="Pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-400">Page {page} of {data.pages}</span>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="btn-ghost disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
