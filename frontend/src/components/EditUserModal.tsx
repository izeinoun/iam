import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '../api'
import type { User } from '../api/types'

interface Props {
  user: User
  onClose: () => void
  onSaved: () => void
}

export default function EditUserModal({ user, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(user.name)
  const [email, setEmail] = useState(user.email ?? '')
  const [initials, setInitials] = useState(user.initials ?? '')
  const [colorHex, setColorHex] = useState(user.color_hex ?? '#64748b')
  const [specialty, setSpecialty] = useState(user.specialty ?? '')
  const [defaultAppId, setDefaultAppId] = useState<string>(user.default_app_id ?? '')

  const appsQ = useQuery({ queryKey: ['apps-all'], queryFn: () => api.listApps(true) })

  // If the user's default_app_id wasn't sent in the row (older data), try to
  // resolve from default_app name.
  useEffect(() => {
    if (defaultAppId || !user.default_app || !appsQ.data) return
    const a = appsQ.data.find((a) => a.name === user.default_app)
    if (a) setDefaultAppId(a.id)
  }, [appsQ.data, user.default_app, defaultAppId])

  const save = useMutation({
    mutationFn: () =>
      api.updateUser(user.id, {
        full_name: fullName,
        email,
        initials: initials || null,
        color_hex: colorHex,
        specialty: specialty || null,
        default_app_id: defaultAppId || null,
      }),
    onSuccess: onSaved,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-base font-semibold">Edit {user.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Full name">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Initials">
              <input
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                maxLength={4}
                placeholder="e.g. JD"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </Field>
            <Field label="Avatar color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 w-12 rounded cursor-pointer"
                />
                <input
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </Field>
          </div>
          <Field label="Specialty (claim auto-assign)">
            <input
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Surgical, Oncology, Inpatient"
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Field>
          <Field label="Default app on login">
            <select
              value={defaultAppId}
              onChange={(e) => setDefaultAppId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">(none)</option>
              {(appsQ.data ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.is_active ? '' : '(inactive)'}
                </option>
              ))}
            </select>
          </Field>
          {save.isError && (
            <p className="text-xs text-red-600">
              Save failed: {(save.error as Error)?.message ?? 'unknown error'}
            </p>
          )}
        </div>
        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={save.isPending}
            className="px-3.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !fullName.trim()}
            className="px-3.5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
