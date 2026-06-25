import axios from 'axios'
import { API_BASE_URL } from '../config/appUrls'

// API base now lives in config/appUrls (committed, switches by build mode).
export { API_BASE_URL }

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Include httpOnly cookies for cross-app session sharing
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

// Reentrancy guard so a persistent 401 can never become an infinite reload
// storm: reload at most once per page load, cleared on the first success.
const RELOAD_GUARD_KEY = 'iam.authReloading'

// On 401 (skip /auth/* so a wrong-password message can surface) figure out
// WHICH credential the backend rejected and drop only that one, then reload:
//   - "Unknown user_id" → the acting user was wiped (e.g. backend re-seed).
//     Drop iam.actorUserId so ActorPicker re-selects a valid user. Reloading
//     WITHOUT clearing it would just 401 again forever.
//   - otherwise (gate token expired/invalid) → drop the demo token and return
//     to the login screen.
client.interceptors.response.use(
  (res) => {
    sessionStorage.removeItem(RELOAD_GUARD_KEY)
    return res
  },
  (err) => {
    const url: string = err.config?.url ?? ''
    if (err.response?.status === 401 && !url.includes('/auth/')) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string' && detail.startsWith('Unknown user_id')) {
        localStorage.removeItem('iam.actorUserId')
      } else {
        localStorage.removeItem('opa_demo_token')
      }
      if (!sessionStorage.getItem(RELOAD_GUARD_KEY)) {
        sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
        window.location.reload()
      }
    }
    return Promise.reject(err)
  },
)
