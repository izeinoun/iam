import { client } from './client'
import type { App, Role, User, UserCreate, UserUpdate } from './types'

export const api = {
  // ── users ──────────────────────────────────────────────────────────────
  async listUsers(includeInactive = false): Promise<User[]> {
    const { data } = await client.get<User[]>('/api/users', {
      params: { include_inactive: includeInactive },
    })
    return data
  },

  async getUser(id: string): Promise<User> {
    const { data } = await client.get<User>(`/api/users/${id}`)
    return data
  },

  async createUser(body: UserCreate): Promise<User> {
    const { data } = await client.post<User>('/api/users', body)
    return data
  },

  async updateUser(id: string, body: UserUpdate): Promise<User> {
    const { data } = await client.patch<User>(`/api/users/${id}`, body)
    return data
  },

  // ── rbac mutations ─────────────────────────────────────────────────────
  async assignRole(userId: string, roleId: string): Promise<User> {
    const { data } = await client.post<User>(
      `/api/users/${userId}/roles/${roleId}`,
    )
    return data
  },

  async revokeRole(userId: string, roleId: string): Promise<User> {
    const { data } = await client.delete<User>(
      `/api/users/${userId}/roles/${roleId}`,
    )
    return data
  },

  async listUserRoles(userId: string): Promise<Role[]> {
    const { data } = await client.get<Role[]>(`/api/users/${userId}/roles`)
    return data
  },

  // ── reference ──────────────────────────────────────────────────────────
  async listApps(): Promise<App[]> {
    const { data } = await client.get<App[]>('/api/apps')
    return data
  },

  async listRoles(): Promise<Role[]> {
    const { data } = await client.get<Role[]>('/api/roles')
    return data
  },
}
