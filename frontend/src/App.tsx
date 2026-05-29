import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Users, KeyRound, Boxes } from 'lucide-react'
import { api } from './api'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import AppsPage from './pages/AppsPage'
import ActorPicker from './components/ActorPicker'

type Tab = 'users' | 'roles' | 'apps'

export default function App() {
  const [tab, setTab] = useState<Tab>('users')
  const usersQ = useQuery({ queryKey: ['users-all'], queryFn: () => api.listUsers(true) })

  return (
    <div className="min-h-screen text-slate-900">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <h1 className="text-lg font-semibold">IAM Admin</h1>
            <span className="ml-2 text-xs text-slate-400 font-mono">
              Payment Integrity Platform · v0.1
            </span>
          </div>
          <ActorPicker users={usersQ.data ?? []} />
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {([
              ['users', 'Users', Users],
              ['roles', 'Roles', KeyRound],
              ['apps', 'Apps', Boxes],
            ] as Array<[Tab, string, typeof Users]>).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tab === 'users' && <UsersPage />}
        {tab === 'roles' && <RolesPage />}
        {tab === 'apps'  && <AppsPage />}
      </main>
    </div>
  )
}
