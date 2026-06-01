export interface User {
  id: string
  name: string
  username: string | null
  email: string | null
  role: string                   // legacy primary
  is_active: boolean
  initials: string | null
  color_hex: string | null
  specialty: string | null
  supervisor_id: string | null
  roles: string[]
  apps: string[]
  default_app: string | null
  default_app_id: string | null
}

export interface App {
  id: string
  name: string
  description: string
  is_active: boolean
}

export interface Role {
  id: string
  name: string
  description: string
  apps: string[]
}

export interface UserCreate {
  username: string
  full_name: string
  email: string
  role?: string
  initials?: string | null
  color_hex?: string | null
  specialty?: string | null
  default_app_id?: string | null
  role_ids?: string[]
}

export interface UserUpdate {
  full_name?: string
  email?: string
  initials?: string | null
  color_hex?: string | null
  specialty?: string | null
  is_active?: boolean
  default_app_id?: string | null
}


// ── Connectors ─────────────────────────────────────────────────────────────

export type ConnectorKind = 'http' | 'sftp' | 'internal' | 'webhook'
export type ConnectorDirection = 'inbound' | 'outbound'

export interface Connector {
  connector_id: string
  name: string
  description: string
  kind: ConnectorKind
  direction: ConnectorDirection
  is_active: boolean
  config: Record<string, any>
  secret_keys: Record<string, any>   // masked map: each key → {set: true}
  input_schema: Record<string, any> | null
  mock_enabled: boolean
  mock_response: Record<string, any> | null
  created_at: string
  updated_at: string
  created_by_user_id: string | null
}

export interface ConnectorCreate {
  name: string
  description?: string
  kind: ConnectorKind
  direction?: ConnectorDirection
  is_active?: boolean
  config?: Record<string, any>
  secret?: Record<string, any>
  input_schema?: Record<string, any> | null
  mock_enabled?: boolean
  mock_response?: Record<string, any> | null
}

export interface ConnectorUpdate {
  name?: string
  description?: string
  direction?: ConnectorDirection
  is_active?: boolean
  config?: Record<string, any>
  secret?: Record<string, any | null>  // null value removes the key
  input_schema?: Record<string, any> | null
  mock_enabled?: boolean
  mock_response?: Record<string, any> | null
}

export interface ConnectorRunResult {
  ok: boolean
  data: any | null
  error: string | null
  duration_ms: number
  metadata: Record<string, any> | null
}

export interface ConnectorRunRow {
  run_id: string
  connector_id: string
  triggered_at: string
  triggered_by_user_id: string | null
  correlation_id: string | null
  duration_ms: number | null
  ok: boolean
  error_message: string | null
  input_preview: string | null
  output_preview: string | null
  metadata: Record<string, any>
}

// ── members (shared reference data; admin-managed) ──────────────────────────

export interface Member {
  member_id: string
  member_number: string
  first_name: string
  last_name: string
  date_of_birth: string                    // YYYY-MM-DD
  lob: string                              // MA | Commercial | Medicaid | …
  coverage_effective_date: string
  coverage_termination_date: string | null
  created_at: string
  updated_at: string
}

export interface MemberCreate {
  member_number: string
  first_name: string
  last_name: string
  date_of_birth: string
  lob: string
  coverage_effective_date: string
  coverage_termination_date?: string | null
}

export interface MemberListResponse {
  total: number
  items: Member[]
}

