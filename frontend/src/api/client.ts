import axios from 'axios'
import { API_BASE_URL } from '../config/appUrls'

// API base now lives in config/appUrls (committed, switches by build mode).
export { API_BASE_URL }

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach acting user_id so the backend's RBAC deps know who's calling
// (X-User-Id header) and audits role grants/revokes correctly
// (actor_user_id query param on mutations).
client.interceptors.request.use((config) => {
  const actor = localStorage.getItem('iam.actorUserId')
  if (actor) {
    config.headers['X-User-Id'] = actor
    if (config.method && ['post', 'patch', 'delete', 'put'].includes(config.method.toLowerCase())) {
      config.params = { ...(config.params ?? {}), actor_user_id: actor }
    }
  }
  // Demo gate: attach the login token when present (no-op when gate disabled).
  const token = localStorage.getItem('opa_demo_token')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Gate rejected us (expired/missing token) — drop it and return to login.
// Skip /auth/* so a wrong-password 401 can surface its message.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? ''
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      localStorage.removeItem('opa_demo_token')
      window.location.reload()
    }
    return Promise.reject(err)
  },
)
