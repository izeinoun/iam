// Connector create + edit. Single modal — kind-specific fields toggle on
// based on the selected kind. Secrets are write-only (existing secret keys
// shown as a mask; new values overwrite). Input schema is edited as raw
// JSON in a textarea — keeps it simple while we don't have a schema builder.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, X } from 'lucide-react'
import { api } from '../api'
import type {
  Connector,
  ConnectorCreate,
  ConnectorKind,
  ConnectorDirection,
  ConnectorUpdate,
} from '../api/types'

interface Props {
  mode: 'create' | 'edit'
  connector?: Connector
  onClose: () => void
  onSaved: () => void
}

const KINDS: Array<[ConnectorKind, string, string]> = [
  ['http',     'HTTP / REST API',  'Outbound call to a JSON-over-HTTP endpoint'],
  ['sftp',     'SFTP',              'Upload files to a remote SFTP host'],
  ['webhook',  'Webhook (outbound)', 'POST a notification to a remote URL when an event fires'],
  ['internal', 'Internal function', 'In-process Python function (advanced)'],
]

export default function ConnectorFormModal({
  mode, connector, onClose, onSaved,
}: Props) {
  // ── Common fields ──
  const [name, setName] = useState(connector?.name ?? '')
  const [description, setDescription] = useState(connector?.description ?? '')
  const [kind, setKind] = useState<ConnectorKind>(connector?.kind ?? 'http')
  const [direction, setDirection] = useState<ConnectorDirection>(connector?.direction ?? 'outbound')
  const [isActive, setIsActive] = useState(connector?.is_active ?? true)

  // ── HTTP / webhook ──
  const [httpUrl, setHttpUrl] = useState(connector?.config?.url ?? '')
  const [httpMethod, setHttpMethod] = useState(connector?.config?.method ?? 'GET')
  const [httpHeadersJson, setHttpHeadersJson] = useState(
    JSON.stringify(connector?.config?.headers ?? {}, null, 2),
  )
  const [httpAuthHeader, setHttpAuthHeader] = useState(connector?.config?.auth_header_name ?? '')
  const [httpAuthFormat, setHttpAuthFormat] = useState(connector?.config?.auth_header_format ?? 'Bearer {key}')
  const [httpTimeout, setHttpTimeout] = useState(String(connector?.config?.timeout_seconds ?? 30))

  // ── SFTP ──
  const [sftpHost, setSftpHost] = useState(connector?.config?.host ?? '')
  const [sftpPort, setSftpPort] = useState(String(connector?.config?.port ?? 22))
  const [sftpUsername, setSftpUsername] = useState(connector?.config?.username ?? '')
  const [sftpRemoteDir, setSftpRemoteDir] = useState(connector?.config?.remote_dir ?? '/')

  // ── Internal ──
  const [internalFn, setInternalFn] = useState(connector?.config?.function ?? '')

  // ── Secrets — masked, write-only ──
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [sftpPassword, setSftpPassword] = useState('')
  const [sftpPrivateKey, setSftpPrivateKey] = useState('')
  const [showSecrets, setShowSecrets] = useState(false)

  // ── Schema + mock ──
  const [inputSchemaJson, setInputSchemaJson] = useState(
    connector?.input_schema ? JSON.stringify(connector.input_schema, null, 2) : '',
  )
  const [mockEnabled, setMockEnabled] = useState(connector?.mock_enabled ?? false)
  const [mockResponseJson, setMockResponseJson] = useState(
    connector?.mock_response ? JSON.stringify(connector.mock_response, null, 2) : '',
  )

  const buildPayload = (): ConnectorCreate | ConnectorUpdate => {
    let config: Record<string, any> = {}
    if (kind === 'http' || kind === 'webhook') {
      let headers: Record<string, any> = {}
      try { headers = httpHeadersJson.trim() ? JSON.parse(httpHeadersJson) : {} } catch {}
      config = {
        url: httpUrl.trim(),
        method: httpMethod,
        headers,
        auth_header_name: httpAuthHeader.trim() || undefined,
        auth_header_format: httpAuthFormat.trim() || undefined,
        timeout_seconds: Number(httpTimeout) || 30,
      }
    } else if (kind === 'sftp') {
      config = {
        host: sftpHost.trim(),
        port: Number(sftpPort) || 22,
        username: sftpUsername.trim(),
        remote_dir: sftpRemoteDir.trim() || '/',
      }
    } else if (kind === 'internal') {
      config = { function: internalFn.trim() }
    }

    const secret: Record<string, any> = {}
    if (kind === 'http' || kind === 'webhook') {
      if (apiKeyValue) secret.api_key = apiKeyValue
    } else if (kind === 'sftp') {
      if (sftpPassword) secret.password = sftpPassword
      if (sftpPrivateKey) secret.private_key_pem = sftpPrivateKey
    }

    let inputSchema: Record<string, any> | null = null
    if (inputSchemaJson.trim()) {
      try { inputSchema = JSON.parse(inputSchemaJson) } catch {}
    }
    let mockResponse: Record<string, any> | null = null
    if (mockResponseJson.trim()) {
      try { mockResponse = JSON.parse(mockResponseJson) } catch {}
    }

    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      direction,
      is_active: isActive,
      config,
      input_schema: inputSchema,
      mock_enabled: mockEnabled,
      mock_response: mockResponse,
    }
    // Only send secret in create or if user typed something
    if (mode === 'create' || Object.keys(secret).length > 0) {
      payload.secret = secret
    }
    if (mode === 'create') {
      payload.kind = kind  // kind is immutable in edit mode (no backend field for it on update)
    }
    return payload
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = buildPayload()
      return mode === 'create'
        ? api.createConnector(payload as ConnectorCreate)
        : api.updateConnector(connector!.connector_id, payload as ConnectorUpdate)
    },
    onSuccess: onSaved,
  })

  const canSubmit = !!name.trim() && !save.isPending && (
    kind === 'internal'  ? !!internalFn.trim() :
    kind === 'sftp'      ? (!!sftpHost.trim() && !!sftpUsername.trim()) :
    /* http | webhook */   !!httpUrl.trim()
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold">
            {mode === 'create' ? 'New connector' : `Edit ${connector?.name}`}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ── Identity ── */}
          <Section title="Identity">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. provider_directory_api"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What this connector does and when it's invoked"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Direction">
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as ConnectorDirection)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
                >
                  <option value="outbound">outbound</option>
                  <option value="inbound">inbound</option>
                </select>
              </Field>
              <Field label="Active">
                <label className="inline-flex items-center gap-2 text-sm mt-1.5">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-indigo-600"
                  />
                  <span>Enabled for use</span>
                </label>
              </Field>
            </div>
          </Section>

          {/* ── Kind selector ── */}
          <Section title="Kind">
            {mode === 'create' ? (
              <div className="space-y-1.5">
                {KINDS.map(([key, label, desc]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKind(key)}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${
                      kind === key
                        ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-slate-900">{label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Kind is fixed after creation: <span className="font-mono">{kind}</span>
              </p>
            )}
          </Section>

          {/* ── Kind-specific config ── */}
          {(kind === 'http' || kind === 'webhook') && (
            <Section title={kind === 'http' ? 'HTTP configuration' : 'Webhook configuration'}>
              <Field label="URL">
                <input
                  value={httpUrl}
                  onChange={(e) => setHttpUrl(e.target.value)}
                  placeholder="https://api.payer.example/members/{member_id}"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Use <code>{'{key}'}</code> placeholders for input substitution.
                </p>
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Method">
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
                  >
                    {['GET','POST','PUT','PATCH','DELETE'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Auth header name">
                  <input
                    value={httpAuthHeader}
                    onChange={(e) => setHttpAuthHeader(e.target.value)}
                    placeholder="Authorization"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                  />
                </Field>
                <Field label="Auth format">
                  <input
                    value={httpAuthFormat}
                    onChange={(e) => setHttpAuthFormat(e.target.value)}
                    placeholder="Bearer {key}"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                  />
                </Field>
              </div>
              <Field label="Additional headers (JSON)">
                <textarea
                  value={httpHeadersJson}
                  onChange={(e) => setHttpHeadersJson(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
              <Field label="Timeout (seconds)">
                <input
                  type="number"
                  value={httpTimeout}
                  onChange={(e) => setHttpTimeout(e.target.value)}
                  className="w-32 px-3 py-2 border border-slate-200 rounded-md text-sm"
                />
              </Field>
            </Section>
          )}

          {kind === 'sftp' && (
            <Section title="SFTP configuration">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Host">
                    <input
                      value={sftpHost}
                      onChange={(e) => setSftpHost(e.target.value)}
                      placeholder="sftp.payer.example"
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                    />
                  </Field>
                </div>
                <Field label="Port">
                  <input
                    type="number"
                    value={sftpPort}
                    onChange={(e) => setSftpPort(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                  />
                </Field>
              </div>
              <Field label="Username">
                <input
                  value={sftpUsername}
                  onChange={(e) => setSftpUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
              <Field label="Remote directory">
                <input
                  value={sftpRemoteDir}
                  onChange={(e) => setSftpRemoteDir(e.target.value)}
                  placeholder="/uploads/inbound"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
            </Section>
          )}

          {kind === 'internal' && (
            <Section title="Internal function">
              <Field label="Function name (must be registered in services.connector_service.INTERNAL_REGISTRY)">
                <input
                  value={internalFn}
                  onChange={(e) => setInternalFn(e.target.value)}
                  placeholder="recompute_priority"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
            </Section>
          )}

          {/* ── Secrets ── */}
          <Section title="Secrets">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {mode === 'edit'
                  ? `Existing keys: ${Object.keys(connector?.secret_keys ?? {}).join(', ') || '(none)'}. Enter a new value to overwrite.`
                  : 'Stored separately from config; masked in list/get responses.'}
              </p>
              <button
                type="button"
                onClick={() => setShowSecrets((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecrets ? 'Hide' : 'Show'}
              </button>
            </div>

            {(kind === 'http' || kind === 'webhook') && (
              <Field label="API key">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder={mode === 'edit' ? '••••• (leave blank to keep current)' : 'sk-...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
            )}
            {kind === 'sftp' && (
              <>
                <Field label="Password">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={sftpPassword}
                    onChange={(e) => setSftpPassword(e.target.value)}
                    placeholder={mode === 'edit' ? '••••• (leave blank to keep current)' : ''}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
                  />
                </Field>
                <Field label="Private key (PEM) — optional alternative to password">
                  <textarea
                    value={sftpPrivateKey}
                    onChange={(e) => setSftpPrivateKey(e.target.value)}
                    rows={3}
                    placeholder="-----BEGIN RSA PRIVATE KEY-----"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                  />
                </Field>
              </>
            )}
            {kind === 'internal' && (
              <p className="text-xs text-slate-400">Internal connectors don't need secrets.</p>
            )}
          </Section>

          {/* ── Mock + schema ── */}
          <Section title="Advanced">
            <label className="inline-flex items-center gap-2 text-sm mb-2">
              <input
                type="checkbox"
                checked={mockEnabled}
                onChange={(e) => setMockEnabled(e.target.checked)}
                className="accent-amber-600"
              />
              <span>Mock mode — return the response below instead of executing</span>
            </label>
            {mockEnabled && (
              <Field label="Mock response (JSON)">
                <textarea
                  value={mockResponseJson}
                  onChange={(e) => setMockResponseJson(e.target.value)}
                  rows={4}
                  placeholder='{"status": "ok"}'
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
                />
              </Field>
            )}
            <Field label="Input schema (JSON Schema; optional)">
              <textarea
                value={inputSchemaJson}
                onChange={(e) => setInputSchemaJson(e.target.value)}
                rows={4}
                placeholder='{"type":"object","required":["member_id"],"properties":{"member_id":{"type":"string"}}}'
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono"
              />
            </Field>
          </Section>

          {save.isError && (
            <p className="text-xs text-red-600">
              Failed: {(save.error as Error)?.message ?? 'unknown error'}
            </p>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={save.isPending} className="px-3.5 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!canSubmit}
            className="px-3.5 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {save.isPending ? 'Saving…' : mode === 'create' ? 'Create connector' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2.5">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
