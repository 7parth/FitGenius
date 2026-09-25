import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Shield, UserX, UserCheck, ChevronDown } from 'lucide-react'
import { api, getErrorMessage } from '@/lib/api'
import { cn, formatDate } from '@/lib/utils'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function UsersAdminPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get('/admin/users', { params: { page, page_size: 50, search: search || undefined } }).then(r => r.data),
    placeholderData: prev => prev,
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: object }) =>
      api.patch(`/admin/users/${userId}`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const users: any[] = data?.items ?? []

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">{data?.total ?? '–'} total users</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or email…"
          className="input w-full pl-9"
          aria-label="Search users"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm" aria-label="Users table">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="p-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-surface-700/50 last:border-0 hover:bg-surface-700/20">
                  <td className="p-4">
                    <p className="font-medium text-white">{u.display_name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-4 text-gray-400 hidden sm:table-cell">{formatDate(u.created_at)}</td>
                  <td className="p-4">
                    <span className={cn(
                      'badge text-xs',
                      u.role === 'admin' ? 'bg-primary-500/20 text-primary-300' : 'bg-surface-600 text-gray-400'
                    )}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn('badge text-xs', u.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300')}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ userId: u.id, body: { is_active: !u.is_active } })}
                        title={u.is_active ? 'Deactivate user' : 'Activate user'}
                        className="btn-ghost p-1.5"
                        aria-label={u.is_active ? `Deactivate ${u.display_name}` : `Activate ${u.display_name}`}
                      >
                        {u.is_active
                          ? <UserX className="w-4 h-4 text-red-400" />
                          : <UserCheck className="w-4 h-4 text-emerald-400" />
                        }
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => updateMutation.mutate({ userId: u.id, body: { role: 'admin' } })}
                          title="Promote to admin"
                          className="btn-ghost p-1.5"
                          aria-label={`Promote ${u.display_name} to admin`}
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 50 && (
        <div className="flex items-center justify-center gap-3" role="navigation" aria-label="Pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 50} className="btn-ghost disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
