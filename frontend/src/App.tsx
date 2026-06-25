import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Users, KeyRound, Boxes, Plug, UserSquare } from 'lucide-react'
import { api } from './api'
import EnvironmentBanner from './components/EnvironmentBanner'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import AppsPage from './pages/AppsPage'
import ConnectorsPage from './pages/ConnectorsPage'
import MembersPage from './pages/MembersPage'
import ActorPicker from './components/ActorPicker'
import AppSwitcher from './components/AppSwitcher'

type Tab = 'users' | 'roles' | 'apps' | 'connectors' | 'members'

interface NavItem {
  key:  Tab
  label: string
  sub:   string
  icon:  typeof Users
}

const NAV: NavItem[] = [
  { key: 'users',      label: 'Users',      sub: 'Identities + roles',       icon: Users },
  { key: 'roles',      label: 'Roles',      sub: 'Role definitions',         icon: KeyRound },
  { key: 'apps',       label: 'Apps',       sub: 'Apps + access grants',     icon: Boxes },
  { key: 'connectors', label: 'Connectors', sub: 'HTTP / SFTP / webhook',    icon: Plug },
  { key: 'members',    label: 'Members',    sub: 'Shared reference data',    icon: UserSquare },
]

// IAM brand palette (mirrors the indigo accent that's already used through
// the page-level components — keeps colors consistent when switching pages).
const BRAND    = '#4f46e5'   // indigo-600
const BRAND_BG = '#eef2ff'   // indigo-50

export default function App() {
  const [tab, setTab] = useState<Tab>('users')
  const usersQ = useQuery({ queryKey: ['users-all'], queryFn: () => api.listUsers(true) })

  return (
    <>
      <EnvironmentBanner />
      <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Left sidebar — matches the ClaimGuard / SIU pattern so all admin
          surfaces read the same way across the platform. */}
      <aside className="w-[230px] shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-semibold tracking-tight text-slate-900 leading-none">
              IAM Admin
            </div>
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 shadow-sm"
              style={{ backgroundColor: BRAND }}
              aria-hidden
            >
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.4} />
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Payment Integrity Platform
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          <div className="px-3 pt-1 pb-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Navigation
          </div>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-left transition group ${
                  active
                    ? 'text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                style={active ? { backgroundColor: BRAND_BG } : undefined}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: active ? BRAND : '#94a3b8' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {item.sub}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        <div className="px-4 py-3 text-[11px] text-slate-400 border-t border-slate-100">
          v0.1 · {new Date().getFullYear()}
        </div>
      </aside>

      {/* Right column — slim top bar + body */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="px-6 py-3 flex items-center justify-end gap-3">
            <AppSwitcher current="iam" />
            <span className="w-px h-6 bg-slate-200" aria-hidden />
            <ActorPicker users={usersQ.data ?? []} />
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-auto p-6">
          {tab === 'users'      && <UsersPage />}
          {tab === 'roles'      && <RolesPage />}
          {tab === 'apps'       && <AppsPage />}
          {tab === 'connectors' && <ConnectorsPage />}
          {tab === 'members'    && <MembersPage />}
        </main>
      </div>
    </div>
    </>
  )
}
