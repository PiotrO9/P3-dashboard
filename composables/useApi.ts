import { createError } from 'nuxt/app'
import type { ApiResponse, EvaluateRequest, FeatureFlag, Group, LoginCredentials, Rule, User } from '../types'

export function useApi() {
	async function apiCall<T>(
		endpoint: string,
		options: {
			method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
			body?: any
		} = {}
	): Promise<ApiResponse<T>> {
		const { method = 'GET', body } = options

		try {
			const response = await $fetch<any>(`/api/proxy${endpoint}`, {
				method,
				body: body ? JSON.stringify(body) : undefined,
				headers: { 'Content-Type': 'application/json' },
			})

			if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
				return response as ApiResponse<T>
			}
			return { success: true, data: response as T } as ApiResponse<T>
		} catch (error: any) {
			console.error('API Error:', error)
			throw createError({
				statusCode: error.response?.status || 500,
				statusMessage: error.data?.message || 'An error occurred',
			})
		}
	}

	const flags = {
		getAll: function () {
			return apiCall<FeatureFlag[]>('/flags')
		},
		create: function (flag: Partial<FeatureFlag>) {
			return apiCall<FeatureFlag>('/flags', { method: 'POST', body: flag })
		},
		update: function (id: string, flag: Partial<FeatureFlag>) {
			return apiCall<FeatureFlag>(`/flags/${id}`, { method: 'PUT', body: flag })
		},
		toggle: function (id: string) {
			return apiCall<FeatureFlag>(`/flags/${id}/toggle`, { method: 'PATCH' })
		},
		addRule: function (id: string, rule: Partial<Rule>) {
			return apiCall<Rule>(`/flags/${id}/rules`, { method: 'POST', body: rule })
		},
		deleteRule: function (flagId: string, ruleId: string) {
			return apiCall(`/flags/${flagId}/rules`, { method: 'DELETE', body: { ruleId } })
		},
		evaluate: function (request: EvaluateRequest) {
			return apiCall<{ result: boolean }>('/evaluate', { method: 'POST', body: request })
		},
	}

	const users = {
		getAll: function () {
			return apiCall<User[]>('/users')
		},
		getById: function (id: string) {
			return apiCall<User>(`/users/${id}`)
		},
		getMe: function () {
			return apiCall<User>('/users/me')
		},
		create: function (user: Partial<User>) {
			return apiCall<User>('/users', { method: 'POST', body: user })
		},
		delete: function (id: string) {
			return apiCall(`/users/${id}`, { method: 'DELETE' })
		},
		getUserGroups: function (userId: string) {
			return apiCall<Group[]>(`/users/${userId}/groups`)
		},
	}

	const groups = {
		getAll: function () {
			return apiCall<Group[]>('/groups')
		},
		getById: function (id: string) {
			return apiCall<Group>(`/groups/${id}`)
		},
		create: function (group: Partial<Group>) {
			return apiCall<Group>('/groups', { method: 'POST', body: group })
		},
		update: function (id: string, group: Partial<Group>) {
			return apiCall<Group>(`/groups/${id}`, { method: 'PUT', body: group })
		},
		delete: function (id: string) {
			return apiCall(`/groups/${id}`, { method: 'DELETE' })
		},
		getMembers: function (groupId: string) {
			return apiCall<User[]>(`/groups/${groupId}/members`)
		},
		addUser: function (groupId: string, userId: string) {
			return apiCall(`/groups/${groupId}/users`, { method: 'POST', body: { userId } })
		},
		removeUser: function (groupId: string, userId: string) {
			return apiCall(`/groups/${groupId}/users/${userId}`, { method: 'DELETE' })
		},
	}

	const auth = {
		login: function (credentials: LoginCredentials) {
			return $fetch<{ user: User; success: boolean }>(`/api/auth/login`, { method: 'POST', body: credentials })
		},
		logout: function () {
			return $fetch(`/api/auth/logout`, { method: 'POST' })
		},
	}

	return { flags, users, groups, auth }
}
