import { createError, navigateTo, useCookie, useState } from 'nuxt/app'
import { computed, readonly, watch } from 'vue'
import type { LoginCredentials, User } from '../types'

export function useAuth() {
	const userCookie = useCookie<User | null>('auth.user', {
		default: function () {
			return null
		},
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: false,
	})

	function hasTokenCookie(): boolean {
		return !!userCookie.value
	}

	const user = useState<User | null>('auth.user', function () {
		return userCookie.value || null
	})

	const isAuthenticated = computed(function () {
		return !!(user.value && user.value.id && hasTokenCookie())
	})

	watch(
		user,
		function (newUser: User | null) {
			userCookie.value = newUser
		},
		{ deep: true }
	)

	async function login(credentials: LoginCredentials) {
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

	async function logout() {
		try {
			await $fetch('/api/auth/logout', { method: 'POST' })
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			user.value = null
			await navigateTo('/login')
		}
	}

	async function refreshUser() {
		if (!isAuthenticated.value) return
		try {
			const response = await $fetch<any>('/api/proxy/users/me')
			if (response && (response.user || response.data)) {
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
