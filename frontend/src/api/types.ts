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
