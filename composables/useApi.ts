import { createError } from 'nuxt/app'
import type {
	ApiResponse,
	FeatureFlag,
	FlagEvaluationRequest,
	FlagEvaluationResult,
	Group,
	LoginCredentials,
	Rule,
	User,
} from '../types'

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
		getAll: async function () {
			const res = await apiCall<any[]>('/flags')
			if (res.success) {
				return {
					success: true,
					data: res.data.map(function (f: any) {
						return { ...f, enabled: f.enabled ?? f.isEnabled ?? false }
					}),
				} as ApiResponse<FeatureFlag[]>
			}
			return res as any
		},
		getById: async function (id: string) {
			const res = await apiCall<any>(`/flags/${id}`)
			if (res.success) {
				return {
					success: true,
					data: { ...res.data, enabled: res.data.enabled ?? res.data.isEnabled ?? false },
				} as ApiResponse<FeatureFlag>
			}
			return res as any
		},
		create: async function (flag: Partial<FeatureFlag> & { isEnabled?: boolean }) {
			const res = await apiCall<any>('/flags', { method: 'POST', body: flag })
			if (res.success) {
				return {
					success: true,
					data: { ...res.data, enabled: res.data.enabled ?? res.data.isEnabled ?? false },
				}
			}
			return res as any
		},
		update: async function (id: string, flag: Partial<FeatureFlag> & { isEnabled?: boolean }) {
			const res = await apiCall<any>(`/flags/${id}`, { method: 'PUT', body: flag })
			if (res.success) {
				return {
					success: true,
					data: { ...res.data, enabled: res.data.enabled ?? res.data.isEnabled ?? false },
				}
			}
			return res as any
		},
		toggle: async function (id: string) {
			try {
				const internal = await $fetch<any>(`/api/flags/${id}/toggle`, { method: 'PATCH' })
				if (internal?.success) {
					const d = internal.data || internal.flag || internal
					return { success: true, data: { ...d, enabled: d.enabled ?? d.isEnabled ?? false } }
				}
			} catch (_) {}
			const res = await apiCall<any>(`/flags/${id}/toggle`, { method: 'PATCH' })
			if (res.success) {
				return {
					success: true,
					data: { ...res.data, enabled: res.data.enabled ?? res.data.isEnabled ?? false },
				}
			}
			return res as any
		},
		addRule: function (id: string, rule: Partial<Rule>) {
			return apiCall<Rule>(`/flags/${id}/rules`, { method: 'POST', body: rule })
		},
		deleteRule: function (flagId: string, ruleId: string) {
			return apiCall(`/flags/${flagId}/rules`, { method: 'DELETE', body: { ruleId } })
		},
		getAdvancedRules: async function (flagId: string) {
			return $fetch<{ success: boolean; rules: any[] }>(`/api/flags/${flagId}/rules`)
		},
		createAdvancedRule: async function (flagId: string, payload: any) {
			return $fetch<{ success: boolean; rule: any }>(`/api/flags/${flagId}/rules`, {
				method: 'POST',
				body: payload,
			})
		},
		deleteAdvancedRule: async function (ruleId: string) {
			return $fetch<{ success: boolean }>(`/api/flags/rules/${ruleId}`, { method: 'DELETE' })
		},
		deleteFlag: async function (flagId: string) {
			try {
				const internal = await $fetch<any>(`/api/flags/${flagId}`, { method: 'DELETE' })
				if (internal?.success) return internal
			} catch (_) {}
			return apiCall(`/flags/${flagId}/rules`, { method: 'DELETE' })
		},
		evaluateAdvanced: async function (payload: { flagId?: string; key?: string; context?: Record<string, any> }) {
			return $fetch<{ success: boolean; result: { matched: boolean; value: any } }>(`/api/flags/evaluate`, {
				method: 'POST',
				body: payload,
			})
		},
		evaluate: async function (payload: FlagEvaluationRequest) {
			// External endpoint (Fastify) proxied through /api/proxy
			// Expects { flagKey, userId?, userAttributes? }
			const res = await apiCall<any>('/evaluate', { method: 'POST', body: payload })
			// Normalize possible shapes into FlagEvaluationResult
			if (res.success) {
				const data: any = res.data
				if (data && typeof data === 'object') {
					if ('result' in data && data.result && typeof data.result === 'object') {
						return {
							success: true,
							matched: data.result.matched,
							value: data.result.value,
						} as FlagEvaluationResult
					}
					if ('matched' in data || 'value' in data) {
						return { success: true, matched: data.matched, value: data.value } as FlagEvaluationResult
					}
				}
				return { success: true, value: data } as FlagEvaluationResult
			}
			return res as FlagEvaluationResult
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
		getAll: async function () {
			try {
				return await apiCall<Group[]>('/groups')
			} catch (e) {
				// Fallback to internal in-memory endpoint (used in dev mode)
				try {
					const internal = await $fetch<{ success: boolean; data: Group[] }>(`/api/groups`)
					if (internal?.success) return { success: true, data: internal.data }
				} catch (_) {}
				throw e
			}
		},
		getById: function (id: string) {
			return apiCall<Group>(`/groups/${id}`)
		},
		create: function (group: Partial<Group>) {
			const payload: any = {
				key: group.key,
				name: group.name,
				description: group.description,
				isActive: group.isActive,
			}
			return apiCall<Group>('/groups', { method: 'POST', body: payload }).catch(async e => {
				try {
					const internal = await $fetch<{ success: boolean; data: Group }>(`/api/groups`, {
						method: 'POST',
						body: payload,
					})
					if (internal?.success) return internal as any
				} catch (_) {}
				throw e
			})
		},
		update: function (id: string, group: Partial<Group>) {
			return apiCall<Group>(`/groups/${id}`, { method: 'PUT', body: group }).catch(async e => {
				// fallback internal
				try {
					const internal = await $fetch<{ success: boolean; data: Group }>(`/api/groups/${id}`, {
						method: 'PUT',
						body: group,
					})
					if (internal?.success) return internal as any
				} catch (_) {}
				throw e
			})
		},
		delete: function (id: string) {
			return apiCall(`/groups/${id}`, { method: 'DELETE' }).catch(async e => {
				try {
					const internal = await $fetch<{ success: boolean }>(`/api/groups/${id}`, { method: 'DELETE' })
					if (internal?.success) return internal as any
				} catch (_) {}
				throw e
			})
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
