import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

const APP_BADGE: Record<string, string> = {
  payguard:   'bg-pink-50 text-pink-700 ring-pink-200',
  claimguard: 'bg-blue-50 text-blue-700 ring-blue-200',
  fwa:        'bg-amber-50 text-amber-700 ring-amber-200',
  cob:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export default function RolesPage() {
  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: api.listRoles })

  if (rolesQ.isLoading) return <p className="text-slate-400">Loading…</p>

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-500">
        These are the global roles defined for the platform. Each role grants
        access to one or more apps. Role-to-app mappings are managed at the
        platform level (read-only here).
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(rolesQ.data ?? []).map((r) => (
          <article key={r.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-semibold capitalize text-slate-900">
                {r.name.replace(/_/g, ' ')}
              </h3>
              <span className="text-xs text-slate-400 font-mono">{r.id.slice(0, 8)}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
              {r.description || '—'}
            </p>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">
                Grants access to
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.apps.length === 0 ? (
                  <span className="text-xs text-slate-400">no apps</span>
                ) : r.apps.map((a) => (
                  <span
                    key={a}
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${
                      APP_BADGE[a] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
                    }`}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
