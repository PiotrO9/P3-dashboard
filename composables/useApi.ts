import { createError, useCookie, useRuntimeConfig } from 'nuxt/app'
import { computed } from 'vue'
import type { ApiResponse, EvaluateRequest, FeatureFlag, Group, LoginCredentials, Rule, User } from '../types'

export const useApi = () => {
	const config = useRuntimeConfig()

	// Access token directly from cookie to avoid circular dependency
	const tokenCookie = useCookie<string>('auth.token')
	const token = computed(() => tokenCookie.value)

	const apiCall = async <T>(
		endpoint: string,
		options: {
			method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
			body?: any
			requiresAuth?: boolean
		} = {}
	): Promise<ApiResponse<T>> => {
		const { method = 'GET', body, requiresAuth = false } = options

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		}

		// Add authorization header if token exists and auth is required
		if (requiresAuth && token.value) {
			headers.Authorization = `Bearer ${token.value}`
		}

		try {
			const response = await $fetch<any>(`${config.public.apiBase}${endpoint}`, {
				method,
				headers,
				body: body ? JSON.stringify(body) : undefined,
			})

			// Check if response is in ApiResponse format or direct data
			if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
				return response as ApiResponse<T>
			} else {
				// Wrap direct response in ApiResponse format
				return {
					success: true,
					data: response as T,
				} as ApiResponse<T>
			}
		} catch (error: any) {
			console.error('API Error:', error)
			throw createError({
				statusCode: error.response?.status || 500,
				statusMessage: error.data?.message || 'An error occurred',
			})
		}
	}

	// Flags API
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

	// Users API
	const users = {
		getAll: () => apiCall<User[]>('/users', { requiresAuth: true }),
		getById: (id: string) => apiCall<User>(`/users/${id}`, { requiresAuth: true }),
		getMe: () => apiCall<User>('/users/me', { requiresAuth: true }),
		create: (user: Partial<User>) => apiCall<User>('/users', { method: 'POST', body: user }),
		delete: (id: string) => apiCall(`/users/${id}`, { method: 'DELETE', requiresAuth: true }),
		getUserGroups: (userId: string) => apiCall<Group[]>(`/users/${userId}/groups`, { requiresAuth: true }),
	}

	// Groups API
	const groups = {
		getAll: () => apiCall<Group[]>('/groups', { requiresAuth: true }),
		getById: (id: string) => apiCall<Group>(`/groups/${id}`, { requiresAuth: true }),
		create: (group: Partial<Group>) =>
			apiCall<Group>('/groups', { method: 'POST', body: group, requiresAuth: true }),
		update: (id: string, group: Partial<Group>) =>
			apiCall<Group>(`/groups/${id}`, { method: 'PUT', body: group, requiresAuth: true }),
		delete: (id: string) => apiCall(`/groups/${id}`, { method: 'DELETE', requiresAuth: true }),
		getMembers: (groupId: string) => apiCall<User[]>(`/groups/${groupId}/members`, { requiresAuth: true }),
		addUser: (groupId: string, userId: string) =>
			apiCall(`/groups/${groupId}/users`, { method: 'POST', body: { userId }, requiresAuth: true }),
		removeUser: (groupId: string, userId: string) =>
			apiCall(`/groups/${groupId}/users/${userId}`, { method: 'DELETE', requiresAuth: true }),
	}

	// Auth API
	const auth = {
		login: (credentials: LoginCredentials) =>
			apiCall<{ user: User; token: string }>('/users/login', { method: 'POST', body: credentials }),
		logout: () => apiCall('/users/logout', { method: 'POST', requiresAuth: true }),
	}

	return {
		flags,
		users,
		groups,
		auth,
	}
}
