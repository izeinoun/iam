// Run-history panel for a single connector. Side drawer; lists the most
// recent invocations with timing, ok/error, and input/output previews.
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, X, XCircle } from 'lucide-react'
import { api } from '../api'
import type { Connector } from '../api/types'

interface Props {
  connector: Connector
  onClose: () => void
}

export default function ConnectorRunHistory({ connector, onClose }: Props) {
  const q = useQuery({
    queryKey: ['connector-runs', connector.connector_id],
    queryFn:  () => api.listConnectorRuns(connector.connector_id),
    // poll lightly while open so a freshly-fired run shows up
    refetchInterval: 5_000,
  })
  const runs = q.data ?? []

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-white w-full max-w-2xl h-full shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-semibold">Run history</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {connector.name} · {connector.kind}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {q.isLoading ? (
            <p className="text-sm text-slate-400">Loading…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-400">No runs yet. Test or run this connector to populate.</p>
          ) : (
            <ul className="space-y-3">
              {runs.map((r) => (
                <li key={r.run_id} className="border border-slate-100 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {r.ok
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <XCircle className="w-4 h-4 text-red-600" />}
                      <span className={`font-medium ${r.ok ? 'text-emerald-900' : 'text-red-900'}`}>
                        {r.ok ? 'OK' : 'Failed'}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.duration_ms ?? '?'}ms
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {r.triggered_at.slice(0, 19).replace('T', ' ')}
                    </span>
                  </div>

                  {r.correlation_id && (
                    <div className="text-[11px] text-slate-500 mb-1 font-mono">
                      correlation_id: {r.correlation_id}
                    </div>
                  )}

                  {!r.ok && r.error_message && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2 mb-2">
                      {r.error_message}
                    </div>
                  )}

                  {Object.keys(r.metadata).length > 0 && (
                    <div className="text-[11px] text-slate-500 mb-2 font-mono break-all">
                      {Object.entries(r.metadata).slice(0, 6).map(([k, v]) => (
                        <span key={k} className="inline-block mr-3">
                          {k}={typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 60)}
                        </span>
                      ))}
                    </div>
                  )}

                  <details className="text-[11px] text-slate-600 mt-2">
                    <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                      Input / output preview
                    </summary>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <pre className="bg-slate-50 rounded p-2 text-[10px] overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                        <span className="text-slate-400">input  </span>{r.input_preview ?? '—'}
                      </pre>
                      <pre className="bg-slate-50 rounded p-2 text-[10px] overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                        <span className="text-slate-400">output </span>{r.output_preview ?? '—'}
                      </pre>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
