// Actor picker — visually mirrors PayGuard's user widget: role-specific
// icon · name (semibold) · colored role pill · chevron · dropdown.
//
// Demo-mode user switcher: writes the selected user_id to localStorage
// (iam.actorUserId) where the API client picks it up as X-User-Id.
import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown, Shield, ShieldCheck, ShieldAlert, User as UserIcon,
} from 'lucide-react'
import type { User } from '../api/types'

interface Props {
  users: User[]
}

const KEY = 'iam.actorUserId'

const ROLE_PILL: Record<string, string> = {
  admin:             'bg-red-100 text-red-700 ring-red-200',
  supervisor:        'bg-purple-100 text-purple-700 ring-purple-200',
  siu_investigator:  'bg-amber-100 text-amber-700 ring-amber-200',
  analyst:           'bg-blue-100 text-blue-700 ring-blue-200',
  specialist:        'bg-blue-100 text-blue-700 ring-blue-200',
  system:            'bg-slate-100 text-slate-600 ring-slate-200',
}

const ROLE_PRIORITY = ['admin', 'supervisor', 'siu_investigator', 'analyst', 'specialist', 'system']

function primaryRole(roles: string[] | undefined, fallbackRole?: string): string {
  if (roles && roles.length > 0) {
    for (const r of ROLE_PRIORITY) {
      if (roles.includes(r)) return r
    }
    return roles[0]
  }
  return fallbackRole || 'analyst'
}

function roleIcon(role: string): typeof UserIcon {
  if (role === 'admin')             return ShieldCheck
  if (role === 'supervisor')        return Shield
  if (role === 'siu_investigator')  return ShieldAlert
  return UserIcon
}

export default function ActorPicker({ users }: Props) {
  const [actorId, setActorId] = useState<string>(() => localStorage.getItem(KEY) ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Pick a default actor when we have no valid one. This fires both on first
  // load (no stored id) AND when the stored id is stale — e.g. it points at a
  // user that was wiped by a backend re-seed. Without the stale-id branch the
  // picker would render "Loading…" forever and keep sending a dead X-User-Id,
  // which 401s every RBAC-gated route ("Unknown user_id").
  useEffect(() => {
    if (users.length === 0) return
    const stillValid = actorId && users.some((u) => u.id === actorId)
    if (stillValid) return
    const admin = users.find((u) => u.roles.includes('admin'))
      ?? users.find((u) => u.role === 'admin')
      ?? users[0]
    if (admin) {
      setActorId(admin.id)
      localStorage.setItem(KEY, admin.id)
    }
  }, [actorId, users])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const onChange = (id: string) => {
    setActorId(id)
    localStorage.setItem(KEY, id)
    setOpen(false)
  }

  const current = users.find((u) => u.id === actorId)
  if (!current) {
    return <span className="text-xs text-slate-400">Loading…</span>
  }

  const role = primaryRole(current.roles, current.role)
  const Icon = roleIcon(role)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        aria-label="Switch user"
      >
        <Icon className="w-4 h-4 text-slate-500" />
        <div className="text-left leading-tight">
          <p className="text-xs font-semibold text-slate-800">{current.name}</p>
          <span
            className={`inline-block mt-0.5 px-1.5 py-px rounded text-[10px] font-medium ring-1 ${ROLE_PILL[role] ?? ROLE_PILL.system}`}
          >
            {role.replace(/_/g, ' ')}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-2 max-h-96 overflow-y-auto z-40">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Switch user (demo)
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              All actions are recorded under the selected user.
            </p>
          </div>
          <div className="py-1">
            {users.map((u) => {
              const uRole = primaryRole(u.roles, u.role)
              const UIcon = roleIcon(uRole)
              const active = u.id === current.id
              return (
                <button
                  key={u.id}
                  onClick={() => onChange(u.id)}
                  className={`w-full text-left px-4 py-1.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors ${
                    active ? 'bg-indigo-50' : ''
                  }`}
                >
                  <UIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${active ? 'font-semibold text-indigo-700' : 'text-slate-800'}`}>
                      {u.name} {u.is_active === false ? <span className="text-slate-400">(inactive)</span> : ''}
                    </p>
                    <span
                      className={`inline-block mt-0.5 px-1.5 py-px rounded text-[10px] font-medium ring-1 ${ROLE_PILL[uRole] ?? ROLE_PILL.system}`}
                    >
                      {uRole.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {active && <span className="text-[10px] text-indigo-700 font-semibold shrink-0">active</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
