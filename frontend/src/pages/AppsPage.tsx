import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Check, Pencil, Plus, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { api } from '../api'
import type { App, User } from '../api/types'

const APP_COLOR: Record<string, string> = {
  payguard:   'border-pink-200 bg-pink-50/40',
  claimguard: 'border-blue-200 bg-blue-50/40',
  fwa:        'border-amber-200 bg-amber-50/40',
  cob:        'border-emerald-200 bg-emerald-50/40',
}

export default function AppsPage() {
  const qc = useQueryClient()
  const appsQ = useQuery({ queryKey: ['apps-all'], queryFn: () => api.listApps(true) })
  const usersQ = useQuery({ queryKey: ['users-all'], queryFn: () => api.listUsers(true) })
  const [showNew, setShowNew] = useState(false)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['apps-all'] })
    qc.invalidateQueries({ queryKey: ['apps'] })
    qc.invalidateQueries({ queryKey: ['roles'] })
    qc.invalidateQueries({ queryKey: ['users'] })
  }

  if (appsQ.isLoading || usersQ.isLoading) return <p className="text-slate-400">Loading…</p>

  const users = usersQ.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Registered apps served by the unified backend. "Users with access"
          is computed live from the role assignments.
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shrink-0"
        >
          <Plus className="w-4 h-4" /> New app
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(appsQ.data ?? []).map((a) => (
          <AppCard key={a.id} app={a} users={users} onChanged={invalidate} />
        ))}
      </div>

      {showNew && (
        <NewAppModal
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


function AppCard({
  app, users, onChanged,
}: { app: App; users: User[]; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(app.name)
  const [draftDesc, setDraftDesc] = useState(app.description)
  const count = users.filter((u) => u.apps.includes(app.name)).length

  const save = useMutation({
    mutationFn: () => api.updateApp(app.id, { name: draftName, description: draftDesc }),
    onSuccess: () => { setEditing(false); onChanged() },
  })
  const toggleActive = useMutation({
    mutationFn: () => api.updateApp(app.id, { is_active: !app.is_active }),
    onSuccess: onChanged,
  })

  return (
    <article
      className={`border rounded-lg p-4 ${
        app.is_active ? (APP_COLOR[app.name] ?? 'border-slate-200 bg-white') : 'border-slate-200 bg-slate-50 opacity-70'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-1">
          <Boxes className="w-5 h-5 text-slate-600" />
          {editing ? (
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="font-semibold flex-1 px-2 py-1 text-sm border border-slate-200 rounded bg-white"
            />
          ) : (
            <h3 className="font-semibold capitalize text-slate-900">{app.name}</h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleActive.mutate()}
            disabled={toggleActive.isPending}
            className={`p-1 ${app.is_active ? 'text-emerald-600' : 'text-slate-400'} hover:opacity-70`}
            title={app.is_active ? 'Click to deactivate' : 'Click to activate'}
          >
            {app.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
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
                  setDraftName(app.name)
                  setDraftDesc(app.description)
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
          rows={2}
          className="w-full text-sm text-slate-600 mb-3 px-2 py-1 border border-slate-200 rounded bg-white"
        />
      ) : (
        <p className="text-sm text-slate-600 mb-3 leading-relaxed">
          {app.description || <span className="text-slate-400">No description</span>}
        </p>
      )}

      <div className="text-xs text-slate-500">
        <span className="font-medium text-slate-700">{count}</span>{' '}
        user{count === 1 ? '' : 's'} with access
      </div>
    </article>
  )
}


function NewAppModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const create = useMutation({
    mutationFn: () => api.createApp(name.trim(), desc.trim()),
    onSuccess: onCreated,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-base font-semibold">New app</h3>
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
              placeholder="e.g. reporting"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="What this app does"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
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
            {create.isPending ? 'Creating…' : 'Create app'}
          </button>
        </div>
      </div>
    </div>
  )
}
