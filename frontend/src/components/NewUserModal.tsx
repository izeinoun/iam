import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '../api'
import type { Role } from '../api/types'

interface Props {
  roles: Role[]
  onClose: () => void
  onCreated: () => void
}

export default function NewUserModal({ roles, onClose, onCreated }: Props) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const create = useMutation({
    mutationFn: () =>
      api.createUser({
        username: username.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        role: roles.find((r) => r.id === selectedRoleIds[0])?.name ?? 'analyst',
        role_ids: selectedRoleIds,
      }),
    onSuccess: onCreated,
  })

  const toggleRole = (id: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canSubmit =
    username.trim().length > 0 &&
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    !create.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-base font-semibold">New user</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Username">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jdoe"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jdoe@payer.example"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <Field label="Roles">
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.id)}
                  className={`text-xs px-2.5 py-1 rounded-full ring-1 capitalize transition ${
                    selectedRoleIds.includes(r.id)
                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-300'
                      : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
                  }`}
                  title={r.description}
                >
                  {r.name.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {selectedRoleIds.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-500">
                {selectedRoleIds.length} role{selectedRoleIds.length === 1 ? '' : 's'} selected
              </p>
            )}
          </Field>
          {create.isError && (
            <p className="text-xs text-red-600">
              Failed: {(create.error as Error)?.message ?? 'unknown error'}
            </p>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
            disabled={create.isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit}
            className="px-3.5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
