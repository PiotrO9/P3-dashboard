import { createError } from 'nuxt/app'
import type { ApiResponse, EvaluateRequest, FeatureFlag, Group, LoginCredentials, Rule, User } from '../types'

export const useApi = () => {
	// Internal helper hitting server proxy which supplies Authorization from httpOnly cookie
	const apiCall = async <T>(
		endpoint: string,
		options: {
			method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
			body?: any
		} = {}
	): Promise<ApiResponse<T>> => {
		const { method = 'GET', body } = options

		try {
			const response = await $fetch<any>(`/api/proxy${endpoint}`, {
				method,
				body: body ? JSON.stringify(body) : undefined,
				headers: { 'Content-Type': 'application/json' },
			})

			if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
				return response as ApiResponse<T>
			} else {
				return { success: true, data: response as T } as ApiResponse<T>
			}
		} catch (error: any) {
			console.error('API Error:', error)
			throw createError({
				statusCode: error.response?.status || 500,
				statusMessage: error.data?.message || 'An error occurred',
			})
		}
	}

	const flags = {
		getAll: () => apiCall<FeatureFlag[]>('/flags'),
		create: (flag: Partial<FeatureFlag>) => apiCall<FeatureFlag>('/flags', { method: 'POST', body: flag }),
		update: (id: string, flag: Partial<FeatureFlag>) =>
			apiCall<FeatureFlag>(`/flags/${id}`, { method: 'PUT', body: flag }),
		toggle: (id: string) => apiCall<FeatureFlag>(`/flags/${id}/toggle`, { method: 'PATCH' }),
		addRule: (id: string, rule: Partial<Rule>) =>
			apiCall<Rule>(`/flags/${id}/rules`, { method: 'POST', body: rule }),
		deleteRule: (flagId: string, ruleId: string) =>
			apiCall(`/flags/${flagId}/rules`, { method: 'DELETE', body: { ruleId } }),
		evaluate: (request: EvaluateRequest) =>
			apiCall<{ result: boolean }>('/evaluate', { method: 'POST', body: request }),
	}

	const users = {
		getAll: () => apiCall<User[]>('/users'),
		getById: (id: string) => apiCall<User>(`/users/${id}`),
		getMe: () => apiCall<User>('/users/me'),
		create: (user: Partial<User>) => apiCall<User>('/users', { method: 'POST', body: user }),
		delete: (id: string) => apiCall(`/users/${id}`, { method: 'DELETE' }),
		getUserGroups: (userId: string) => apiCall<Group[]>(`/users/${userId}/groups`),
	}

	const groups = {
		getAll: () => apiCall<Group[]>('/groups'),
		getById: (id: string) => apiCall<Group>(`/groups/${id}`),
		create: (group: Partial<Group>) => apiCall<Group>('/groups', { method: 'POST', body: group }),
		update: (id: string, group: Partial<Group>) => apiCall<Group>(`/groups/${id}`, { method: 'PUT', body: group }),
		delete: (id: string) => apiCall(`/groups/${id}`, { method: 'DELETE' }),
		getMembers: (groupId: string) => apiCall<User[]>(`/groups/${groupId}/members`),
		addUser: (groupId: string, userId: string) =>
			apiCall(`/groups/${groupId}/users`, { method: 'POST', body: { userId } }),
		removeUser: (groupId: string, userId: string) =>
			apiCall(`/groups/${groupId}/users/${userId}`, { method: 'DELETE' }),
	}

	const auth = {
		login: (credentials: LoginCredentials) =>
			$fetch<{ user: User; success: boolean }>(`/api/auth/login`, { method: 'POST', body: credentials }),
		logout: () => $fetch(`/api/auth/logout`, { method: 'POST' }),
	}

	return { flags, users, groups, auth }
}
