import axios from 'axios'

const RAW = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

function normalize(v: string): string {
  if (!v) return 'http://localhost:8001'
  if (/^https?:\/\//i.test(v)) return v
  if (v.startsWith('localhost') || v.startsWith('127.')) return `http://${v}`
  return `https://${v}`
}

export const API_BASE_URL = normalize(RAW)

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach acting user_id so backend audits role grants/revokes correctly.
client.interceptors.request.use((config) => {
  const actor = localStorage.getItem('iam.actorUserId')
  if (actor && config.method && ['post', 'patch', 'delete', 'put'].includes(config.method.toLowerCase())) {
    config.params = { ...(config.params ?? {}), actor_user_id: actor }
  }
  return config
})
