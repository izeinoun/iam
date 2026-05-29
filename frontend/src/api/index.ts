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

  // ── apps ───────────────────────────────────────────────────────────────
  async listApps(includeInactive = false): Promise<App[]> {
    const { data } = await client.get<App[]>('/api/apps', {
      params: { include_inactive: includeInactive },
    })
    return data
  },

  async createApp(name: string, description: string): Promise<App> {
    const { data } = await client.post<App>('/api/apps', { name, description })
    return data
  },

  async updateApp(
    id: string,
    body: { name?: string; description?: string; is_active?: boolean },
  ): Promise<App> {
    const { data } = await client.patch<App>(`/api/apps/${id}`, body)
    return data
  },

  // ── roles ──────────────────────────────────────────────────────────────
  async listRoles(): Promise<Role[]> {
    const { data } = await client.get<Role[]>('/api/roles')
    return data
  },

  async createRole(
    name: string,
    description: string,
    appIds: string[] = [],
  ): Promise<Role> {
    const { data } = await client.post<Role>('/api/roles', {
      name,
      description,
      app_ids: appIds,
    })
    return data
  },

  async updateRole(
    id: string,
    body: { name?: string; description?: string },
  ): Promise<Role> {
    const { data } = await client.patch<Role>(`/api/roles/${id}`, body)
    return data
  },

  async grantAppToRole(roleId: string, appId: string): Promise<Role> {
    const { data } = await client.post<Role>(
      `/api/roles/${roleId}/apps/${appId}`,
    )
    return data
  },

  async revokeAppFromRole(roleId: string, appId: string): Promise<Role> {
    const { data } = await client.delete<Role>(
      `/api/roles/${roleId}/apps/${appId}`,
    )
    return data
  },
}
