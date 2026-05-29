import { useQuery } from '@tanstack/react-query'
import { Boxes } from 'lucide-react'
import { api } from '../api'

const APP_COLOR: Record<string, string> = {
  payguard:   'border-pink-200 bg-pink-50/40',
  claimguard: 'border-blue-200 bg-blue-50/40',
  fwa:        'border-amber-200 bg-amber-50/40',
  cob:        'border-emerald-200 bg-emerald-50/40',
}

export default function AppsPage() {
  const appsQ = useQuery({ queryKey: ['apps'], queryFn: api.listApps })
  const usersQ = useQuery({ queryKey: ['users-all'], queryFn: () => api.listUsers(true) })

  if (appsQ.isLoading || usersQ.isLoading) return <p className="text-slate-400">Loading…</p>

  const users = usersQ.data ?? []

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-500">
        Registered applications served by the unified backend. The "Users
        with access" count reflects how many users have at least one role
        mapping to that app.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(appsQ.data ?? []).map((a) => {
          const count = users.filter((u) => u.apps.includes(a.name)).length
          return (
            <article
              key={a.id}
              className={`border rounded-lg p-4 ${APP_COLOR[a.name] ?? 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Boxes className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold capitalize text-slate-900">
                  {a.name}
                </h3>
                {!a.is_active && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                    inactive
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                {a.description || '—'}
              </p>
              <div className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{count}</span>{' '}
                user{count === 1 ? '' : 's'} with access
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
