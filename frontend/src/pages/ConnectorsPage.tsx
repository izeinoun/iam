import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react'
import { api } from '../api'
import type { Connector, ConnectorRunResult } from '../api/types'
import ConnectorFormModal from '../components/ConnectorFormModal'
import ConnectorRunHistory from '../components/ConnectorRunHistory'

const KIND_BADGE: Record<string, string> = {
  http:     'bg-blue-50 text-blue-700 ring-blue-200',
  sftp:     'bg-amber-50 text-amber-700 ring-amber-200',
  internal: 'bg-slate-50 text-slate-700 ring-slate-200',
  webhook:  'bg-purple-50 text-purple-700 ring-purple-200',
}

const DIRECTION_BADGE: Record<string, string> = {
  inbound:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  outbound: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
}

export default function ConnectorsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<Connector | null>(null)
  const [historyFor, setHistoryFor] = useState<Connector | null>(null)
  const [testResultFor, setTestResultFor] = useState<{
    connectorId: string
    result: ConnectorRunResult
  } | null>(null)

  const q = useQuery({
    queryKey: ['connectors'],
    queryFn:  () => api.listConnectors(),
  })

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (q.data ?? []).filter((c) =>
      !s ||
      c.name.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s) ||
      c.kind.toLowerCase().includes(s),
    )
  }, [q.data, search])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['connectors'] })

  const toggleActive = useMutation({
    mutationFn: (c: Connector) =>
      api.updateConnector(c.connector_id, { is_active: !c.is_active }),
    onSuccess: invalidate,
  })
  const del = useMutation({
    mutationFn: (id: string) => api.deleteConnector(id),
    onSuccess: invalidate,
  })
  const test = useMutation({
    mutationFn: (c: Connector) => api.testConnector(c.connector_id),
    onSuccess: (data, c) => setTestResultFor({ connectorId: c.connector_id, result: data }),
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
              placeholder="Search by name, description, or kind…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> New connector
        </button>
      </div>

      <div className="text-sm text-slate-500">
        Platform-wide integrations: HTTP APIs, SFTP endpoints, internal
        functions, and outbound webhooks. Each connector is admin-managed
        and audited (see the run history per connector). Secrets are
        masked in this view; create or edit a connector to set them.
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Connector</th>
              <th className="text-left px-4 py-3 font-medium">Kind</th>
              <th className="text-left px-4 py-3 font-medium">Direction</th>
              <th className="text-left px-4 py-3 font-medium">Endpoint / config</th>
              <th className="text-center px-4 py-3 font-medium">Mock</th>
              <th className="text-center px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {q.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                {search ? 'No matches.' : 'No connectors yet. Create one to integrate with an external system.'}
              </td></tr>
            ) : filtered.map((c) => (
              <tr key={c.connector_id} className={c.is_active ? '' : 'opacity-50'}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{c.name}</div>
                  {c.description && (
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[280px]">
                      {c.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${KIND_BADGE[c.kind] ?? KIND_BADGE.internal}`}>
                    {c.kind}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ring-1 capitalize ${DIRECTION_BADGE[c.direction] ?? DIRECTION_BADGE.outbound}`}>
                    {c.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 font-mono max-w-[280px] truncate" title={describeEndpoint(c)}>
                  {describeEndpoint(c)}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.mock_enabled ? (
                    <span title="Mock response is being returned" className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                      MOCK
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive.mutate(c)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ring-1 ${
                      c.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:opacity-70'
                        : 'bg-slate-100 text-slate-500 ring-slate-200 hover:opacity-70'
                    }`}
                    title={c.is_active ? 'Click to deactivate' : 'Click to activate'}
                  >
                    {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-0.5 justify-end">
                    <button
                      onClick={() => test.mutate(c)}
                      disabled={test.isPending}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Test connection (no logging)"
                    >
                      <Zap className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setHistoryFor(c)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded"
                      title="Run history"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditing(c)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete connector "${c.name}"? Run history is preserved.`)) {
                          del.mutate(c.connector_id)
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Last test result toast (compact, dismissible) */}
      {testResultFor && (
        <div className={`p-3 rounded-lg border text-sm flex items-start justify-between gap-3 ${
          testResultFor.result.ok
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            {testResultFor.result.ok
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              : <XCircle className="w-4 h-4 text-red-600 mt-0.5" />}
            <div>
              <div className={`font-medium ${testResultFor.result.ok ? 'text-emerald-900' : 'text-red-900'}`}>
                Test {testResultFor.result.ok ? 'succeeded' : 'failed'}
                <span className="text-xs font-normal ml-2 text-slate-500">
                  ({testResultFor.result.duration_ms}ms)
                </span>
              </div>
              {!testResultFor.result.ok && testResultFor.result.error && (
                <div className="text-xs text-red-700 mt-1">{testResultFor.result.error}</div>
              )}
              {testResultFor.result.ok && testResultFor.result.metadata && (
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  {Object.entries(testResultFor.result.metadata).slice(0, 4).map(([k, v]) =>
                    `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`
                  ).join('  ')}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setTestResultFor(null)} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showNew && (
        <ConnectorFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false)
            invalidate()
          }}
        />
      )}
      {editing && (
        <ConnectorFormModal
          mode="edit"
          connector={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}
      {historyFor && (
        <ConnectorRunHistory
          connector={historyFor}
          onClose={() => setHistoryFor(null)}
        />
      )}
    </div>
  )
}


// Compact endpoint description used in the table cell.
function describeEndpoint(c: Connector): string {
  if (c.kind === 'http' || c.kind === 'webhook') {
    const method = c.config.method ?? 'GET'
    return `${method} ${c.config.url ?? '<no URL>'}`
  }
  if (c.kind === 'sftp') {
    const host = c.config.host ?? '<no host>'
    const port = c.config.port ?? 22
    return `sftp://${host}:${port}${c.config.remote_dir ?? '/'}`
  }
  if (c.kind === 'internal') {
    return `fn: ${c.config.function ?? '<not set>'}`
  }
  return JSON.stringify(c.config).slice(0, 80)
}
