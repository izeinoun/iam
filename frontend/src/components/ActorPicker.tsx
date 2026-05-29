import { useEffect, useState } from 'react'
import { User as UserIcon } from 'lucide-react'
import type { User } from '../api/types'

interface Props {
  users: User[]
}

const KEY = 'iam.actorUserId'

export default function ActorPicker({ users }: Props) {
  const [actorId, setActorId] = useState<string>(() => localStorage.getItem(KEY) ?? '')

  // Auto-select an admin user the first time we see one.
  useEffect(() => {
    if (!actorId && users.length > 0) {
      const admin = users.find((u) => u.roles.includes('admin'))
        ?? users.find((u) => u.role === 'admin')
        ?? users[0]
      if (admin) {
        setActorId(admin.id)
        localStorage.setItem(KEY, admin.id)
      }
    }
  }, [actorId, users])

  const onChange = (id: string) => {
    setActorId(id)
    localStorage.setItem(KEY, id)
  }

  const current = users.find((u) => u.id === actorId)

  return (
    <div className="flex items-center gap-2 text-sm">
      <UserIcon className="w-4 h-4 text-slate-400" />
      <span className="text-slate-500">Acting as</span>
      <select
        value={actorId}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} {u.is_active === false ? '(inactive)' : ''}
          </option>
        ))}
      </select>
      {current && current.roles.length > 0 && (
        <span className="text-xs text-slate-400">
          ({current.roles.join(', ')})
        </span>
      )}
    </div>
  )
}
