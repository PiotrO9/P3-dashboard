import { createError, navigateTo, useCookie, useState } from 'nuxt/app'
import { computed, readonly, watch } from 'vue'
import type { LoginCredentials, User } from '../types'

export const useAuth = () => {
	// User cookie (non-httpOnly so we can hydrate client state). Token will be httpOnly and managed server-side.
	const userCookie = useCookie<User | null>('auth.user', {
		default: () => null,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: false,
	})

	// We keep a reactive boolean for auth state; token itself is never exposed to client JS anymore.
	const hasTokenCookie = () => {
		// We cannot read the httpOnly token cookie directly; rely on heuristic: user + server validation flows.
		return !!userCookie.value
	}

	const user = useState<User | null>('auth.user', () => userCookie.value || null)

	const isAuthenticated = computed(() => {
		return !!(user.value && user.value.id && hasTokenCookie())
	})

	watch(
		user,
		(newUser: User | null) => {
			userCookie.value = newUser
		},
		{ deep: true }
	)

	const login = async (credentials: LoginCredentials) => {
		try {
			const response = await $fetch<any>('/api/auth/login', {
				method: 'POST',
				body: credentials,
			})

			if (response && response.user) {
				user.value = response.user
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
			await $fetch('/api/auth/logout', { method: 'POST' })
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			user.value = null
			await navigateTo('/login')
		}
	}

	const refreshUser = async () => {
		if (!isAuthenticated.value) return
		try {
			// Call proxy to fetch current user; proxy adds Authorization automatically from httpOnly cookie
			const response = await $fetch<any>('/api/proxy/users/me')
			if (response && (response.user || response.data)) {
				// Support both direct user or ApiResponse shape
				user.value = response.user || response.data
			}
		} catch (error) {
			console.error('Error refreshing user:', error)
			await logout()
		}
	}

	return {
		user: readonly(user),
		isAuthenticated: readonly(isAuthenticated),
		login,
		logout,
		refreshUser,
	}
}
