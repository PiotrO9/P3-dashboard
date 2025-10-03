import { createError, navigateTo, useCookie, useRuntimeConfig, useState } from 'nuxt/app'
import { computed, readonly, watch } from 'vue'
import type { LoginCredentials, User } from '../types'

export const useAuth = () => {
	// Use cookies for SSR hydration consistency
	const userCookie = useCookie<User | null>('auth.user', {
		default: () => null,
		sameSite: 'lax',
		secure: false, // Set to true in production with HTTPS
		httpOnly: false,
	})

	const tokenCookie = useCookie<string | null>('auth.token', {
		default: () => null,
		sameSite: 'lax',
		secure: false, // Set to true in production with HTTPS
		httpOnly: false,
	})

	// Use useState with cookie initialization
	const user = useState<User | null>('auth.user', () => {
		// Initialize from cookie or localStorage
		if (userCookie.value) {
			return userCookie.value
		}

		if (import.meta.client) {
			const stored = localStorage.getItem('auth.user')
			if (stored) {
				try {
					const parsed = JSON.parse(stored)
					userCookie.value = parsed
					return parsed
				} catch (e) {
					localStorage.removeItem('auth.user')
				}
			}
		}

		return null
	})

	const token = useState<string | null>('auth.token', () => {
		// Initialize from cookie or localStorage
		if (tokenCookie.value) {
			return tokenCookie.value
		}

		if (import.meta.client) {
			const stored = localStorage.getItem('auth.token')
			if (stored) {
				tokenCookie.value = stored
				return stored
			}
		}

		return null
	})

	const isAuthenticated = computed(() => {
		return !!(user.value && token.value && user.value.id && token.value.length > 0)
	})

	// Sync state with cookies and localStorage
	watch(
		user,
		(newUser: User | null) => {
			userCookie.value = newUser
			if (import.meta.client) {
				if (newUser) {
					localStorage.setItem('auth.user', JSON.stringify(newUser))
				} else {
					localStorage.removeItem('auth.user')
				}
			}
		},
		{ deep: true }
	)

	watch(token, (newToken: string | null) => {
		tokenCookie.value = newToken
		if (import.meta.client) {
			if (newToken) {
				localStorage.setItem('auth.token', newToken)
			} else {
				localStorage.removeItem('auth.token')
			}
		}
	})

	const login = async (credentials: LoginCredentials) => {
		try {
			const config = useRuntimeConfig()

			const response = await $fetch<any>(`${config.public.apiBase}/users/login`, {
				method: 'POST',
				body: credentials,
			})

			if (response && response.token && response.user) {
				user.value = response.user
				token.value = response.token
				return response
			}

			throw new Error(response?.message || 'Login failed')
		} catch (error: any) {
			console.error('Login error:', error)
			throw createError({
				statusCode: error.response?.status || 401,
				statusMessage: error.data?.message || error.message || 'Login failed',
			})
		}
	}

	const logout = async () => {
		try {
			if (isAuthenticated.value) {
				const config = useRuntimeConfig()
				await $fetch(`${config.public.apiBase}/auth/logout`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token.value}`,
					},
				})
			}
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			// Clear state regardless of API success
			user.value = null
			token.value = null

			// Redirect to login
			await navigateTo('/login')
		}
	}

	const refreshUser = async () => {
		if (!isAuthenticated.value) return

		try {
			const config = useRuntimeConfig()
			const response = await $fetch<any>(`${config.public.apiBase}/users/me`, {
				headers: {
					Authorization: `Bearer ${token.value}`,
				},
			})

			if (response && response.success && response.data) {
				user.value = response.data
			}
		} catch (error) {
			console.error('Error refreshing user:', error)
			// If token is invalid, logout
			await logout()
		}
	}

	return {
		user: readonly(user),
		token: readonly(token),
		isAuthenticated: readonly(isAuthenticated),
		login,
		logout,
		refreshUser,
	}
}
