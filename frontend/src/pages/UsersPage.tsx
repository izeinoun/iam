import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { api } from '../api'
import type { Role, User } from '../api/types'
import NewUserModal from '../components/NewUserModal'
import EditUserModal from '../components/EditUserModal'

const APP_BADGE: Record<string, string> = {
  payguard:   'bg-pink-50 text-pink-700 ring-pink-200',
  claimguard: 'bg-blue-50 text-blue-700 ring-blue-200',
  fwa:        'bg-amber-50 text-amber-700 ring-amber-200',
  cob:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const ROLE_BADGE: Record<string, string> = {
  admin:                  'bg-indigo-50 text-indigo-700 ring-indigo-200',
  supervisor:             'bg-purple-50 text-purple-700 ring-purple-200',
  analyst:                'bg-slate-50 text-slate-700 ring-slate-200',
  specialist:             'bg-slate-50 text-slate-700 ring-slate-200',
  investigator:           'bg-amber-50 text-amber-700 ring-amber-200',
  recoupment_specialist:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  system:                 'bg-gray-100 text-gray-600 ring-gray-200',
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  const usersQ = useQuery({
    queryKey: ['users', showInactive],
    queryFn: () => api.listUsers(showInactive),
  })
  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: api.listRoles })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (usersQ.data ?? []).filter((u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q),
    )
  }, [usersQ.data, search])

  const toggleActive = useMutation({
    mutationFn: (u: User) => api.updateUser(u.id, { is_active: !u.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const assignRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.assignRole(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const revokeRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.revokeRole(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or username…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-indigo-600"
            />
            Show inactive
          </label>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New user
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Roles</th>
              <th className="text-left px-4 py-3 font-medium">Apps</th>
              <th className="text-left px-4 py-3 font-medium">Default</th>
              <th className="text-center px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersQ.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No users.</td></tr>
            ) : filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                roles={rolesQ.data ?? []}
                onAssign={(roleId) => assignRole.mutate({ userId: u.id, roleId })}
                onRevoke={(roleId) => revokeRole.mutate({ userId: u.id, roleId })}
                onToggleActive={() => toggleActive.mutate(u)}
                onEdit={() => setEditing(u)}
                disabled={assignRole.isPending || revokeRole.isPending}
              />
            ))}
          </tbody>
        </table>
      </div>

      {(assignRole.isError || revokeRole.isError || toggleActive.isError) && (
        <p className="text-xs text-red-600">
          Last action failed: {String(
            (assignRole.error ?? revokeRole.error ?? toggleActive.error) as Error,
          )}
        </p>
      )}

      {showNew && (
        <NewUserModal
          roles={rolesQ.data ?? []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            qc.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}

      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            qc.invalidateQueries({ queryKey: ['users'] })
          }}
        />
      )}
    </div>
  )
}


interface RowProps {
  user: User
  roles: Role[]
  onAssign: (roleId: string) => void
  onRevoke: (roleId: string) => void
  onToggleActive: () => void
  onEdit: () => void
  disabled: boolean
}

function UserRow({ user, roles, onAssign, onRevoke, onToggleActive, onEdit, disabled }: RowProps) {
  const userRoleNames = new Set(user.roles)
  const availableToAssign = roles.filter((r) => !userRoleNames.has(r.name))
  const userRoleIds = roles
    .filter((r) => userRoleNames.has(r.name))
    .map((r) => ({ id: r.id, name: r.name }))

  // For each app the user has, find which of their roles grants it.
  // (If multiple roles grant the same app, list them all so the admin
  // knows that revoking one role won't necessarily revoke app access.)
  const appLineage = (appName: string): string[] =>
    roles
      .filter((r) => userRoleNames.has(r.name) && r.apps.includes(appName))
      .map((r) => r.name)

  return (
    <tr className={user.is_active ? '' : 'opacity-50'}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white text-xs shrink-0"
            style={{ background: user.color_hex ?? '#64748b' }}
          >
            {user.initials ?? user.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-400">@{user.username ?? '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700">{user.email ?? '—'}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5 items-center">
          {userRoleIds.map((r) => (
            <span
              key={r.id}
              className={`group inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${
                ROLE_BADGE[r.name] ?? 'bg-slate-50 text-slate-700 ring-slate-200'
              }`}
            >
              {r.name.replace(/_/g, ' ')}
              <button
                onClick={() => onRevoke(r.id)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/60 rounded-full p-0.5"
                title={`Revoke ${r.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {availableToAssign.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && onAssign(e.target.value)}
              disabled={disabled}
              className="text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              <option value="">+ add role</option>
              {availableToAssign.map((r) => (
                <option key={r.id} value={r.id}>{r.name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          {user.apps.length === 0 ? (
            <span className="text-xs text-slate-400">—</span>
          ) : user.apps.map((a) => {
            const granters = appLineage(a)
            const tooltip = granters.length > 0
              ? `Granted via ${granters.join(' + ')}`
              : 'No granting role found'
            return (
              <div key={a} className="group relative inline-flex items-center gap-1.5">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${
                    APP_BADGE[a] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
                  }`}
                  title={tooltip}
                >
                  {a}
                </span>
                <span className="text-[10px] text-slate-400 italic truncate max-w-[140px]" title={tooltip}>
                  via {granters.join(' + ') || '?'}
                </span>
              </div>
            )
          })}
        </div>
      </td>
      <td className="px-4 py-3 text-slate-700 capitalize">{user.default_app ?? '—'}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={onToggleActive}
          className={`inline-flex ${user.is_active ? 'text-emerald-600' : 'text-slate-400'} hover:opacity-70`}
          title={user.is_active ? 'Click to deactivate' : 'Click to activate'}
        >
          {user.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onEdit}
          className="text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 text-xs"
          title="Edit user"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  )
}
