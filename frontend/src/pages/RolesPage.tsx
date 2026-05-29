import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { api } from '../api'
import type { App, Role } from '../api/types'

const APP_BADGE: Record<string, string> = {
  payguard:   'bg-pink-50 text-pink-700 ring-pink-200',
  claimguard: 'bg-blue-50 text-blue-700 ring-blue-200',
  fwa:        'bg-amber-50 text-amber-700 ring-amber-200',
  cob:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export default function RolesPage() {
  const qc = useQueryClient()
  const rolesQ = useQuery({ queryKey: ['roles'], queryFn: api.listRoles })
  const appsQ = useQuery({ queryKey: ['apps-all'], queryFn: () => api.listApps(true) })
  const [showNew, setShowNew] = useState(false)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roles'] })
    qc.invalidateQueries({ queryKey: ['users'] })
  }

  if (rolesQ.isLoading || appsQ.isLoading) return <p className="text-slate-400">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Global roles. Each role grants access to one or more apps. Edit
          descriptions inline, or grant/revoke apps with the chips below.
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shrink-0"
        >
          <Plus className="w-4 h-4" /> New role
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(rolesQ.data ?? []).map((r) => (
          <RoleCard key={r.id} role={r} apps={appsQ.data ?? []} onChanged={invalidate} />
        ))}
      </div>

      {showNew && (
        <NewRoleModal
          apps={appsQ.data ?? []}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false)
            invalidate()
          }}
        />
      )}
    </div>
  )
}


// ── Role card with inline edits + app grant management ────────────────────

function RoleCard({
  role, apps, onChanged,
}: { role: Role; apps: App[]; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(role.name)
  const [draftDesc, setDraftDesc] = useState(role.description)

  const save = useMutation({
    mutationFn: () => api.updateRole(role.id, { name: draftName, description: draftDesc }),
    onSuccess: () => { setEditing(false); onChanged() },
  })
  const grant = useMutation({
    mutationFn: (appId: string) => api.grantAppToRole(role.id, appId),
    onSuccess: onChanged,
  })
  const revoke = useMutation({
    mutationFn: (appId: string) => api.revokeAppFromRole(role.id, appId),
    onSuccess: onChanged,
  })

  const grantedNames = new Set(role.apps)
  const availableApps = apps.filter((a) => !grantedNames.has(a.name) && a.is_active)

  return (
    <article className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-1.5">
        {editing ? (
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="font-semibold flex-1 mr-2 px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        ) : (
          <h3 className="font-semibold capitalize text-slate-900">
            {role.name.replace(/_/g, ' ')}
          </h3>
        )}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button
                onClick={() => save.mutate()}
                disabled={save.isPending}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setDraftName(role.name)
                  setDraftDesc(role.description)
                }}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          rows={3}
          className="w-full text-sm text-slate-600 mb-3 px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      ) : (
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
          {role.description || <span className="text-slate-400">No description</span>}
        </p>
      )}

      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">
          Grants access to
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {role.apps.length === 0 && (
            <span className="text-xs text-slate-400 italic">no apps yet</span>
          )}
          {role.apps.map((appName) => {
            const app = apps.find((a) => a.name === appName)
            return (
              <span
                key={appName}
                className={`group inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${
                  APP_BADGE[appName] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
                }`}
              >
                {appName}
                {app && (
                  <button
                    onClick={() => revoke.mutate(app.id)}
                    disabled={revoke.isPending}
                    className="opacity-0 group-hover:opacity-100 hover:bg-white/60 rounded-full p-0.5"
                    title={`Revoke ${appName}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )
          })}
          {availableApps.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && grant.mutate(e.target.value)}
              disabled={grant.isPending}
              className="text-xs px-2 py-0.5 rounded border border-dashed border-slate-300 bg-white text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
            >
              <option value="">+ grant app</option>
              {availableApps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </article>
  )
}


// ── New-role modal ────────────────────────────────────────────────────────

function NewRoleModal({
  apps, onClose, onCreated,
}: { apps: App[]; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [appIds, setAppIds] = useState<string[]>([])
  const create = useMutation({
    mutationFn: () => api.createRole(name.trim(), desc.trim(), appIds),
    onSuccess: onCreated,
  })
  const toggle = (id: string) =>
    setAppIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-base font-semibold">New role</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. auditor"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What this role represents and what it's allowed to do"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Initial app grants</label>
            <div className="flex flex-wrap gap-2">
              {apps.filter((a) => a.is_active).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className={`text-xs px-2.5 py-1 rounded-full ring-1 capitalize transition ${
                    appIds.includes(a.id)
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                      : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
          {create.isError && (
            <p className="text-xs text-red-600">
              Failed: {(create.error as Error)?.message ?? 'unknown error'}
            </p>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-3.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !name.trim()}
            className="px-3.5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create role'}
          </button>
        </div>
      </div>
    </div>
  )
}
