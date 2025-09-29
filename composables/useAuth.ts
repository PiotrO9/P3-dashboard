import type { User, AuthState, LoginCredentials } from '~/types'

export const useAuth = () => {
	const user = useState<User | null>('auth.user', () => null)
	const token = useState<string | null>('auth.token', () => null)

	const isAuthenticated = computed(() => !!user.value && !!token.value)

	const login = async (credentials: LoginCredentials) => {
		const { auth } = useApi()

		try {
			const response = await auth.login(credentials)

			if (response.success && response.data) {
				user.value = response.data.user
				token.value = response.data.token

				// Store in localStorage for persistence
				if (import.meta.client) {
					localStorage.setItem('auth.user', JSON.stringify(response.data.user))
					localStorage.setItem('auth.token', response.data.token)
				}

				return response
			}

			throw new Error(response.message || 'Login failed')
		} catch (error) {
			console.error('Login error:', error)
			throw error
		}
	}

	const logout = async () => {
		try {
			if (isAuthenticated.value) {
				const { auth } = useApi()
				await auth.logout()
			}
		} catch (error) {
			console.error('Logout error:', error)
		} finally {
			// Clear state regardless of API success
			user.value = null
			token.value = null

			// Clear localStorage
			if (import.meta.client) {
				localStorage.removeItem('auth.user')
				localStorage.removeItem('auth.token')
			}

			// Redirect to login
			await navigateTo('/login')
		}
	}

	const initializeAuth = () => {
		// Initialize from localStorage on client side
		if (import.meta.client) {
			const storedUser = localStorage.getItem('auth.user')
			const storedToken = localStorage.getItem('auth.token')

			if (storedUser && storedToken) {
				try {
					user.value = JSON.parse(storedUser)
					token.value = storedToken
				} catch (error) {
					console.error('Error parsing stored auth data:', error)
					logout()
				}
			}
		}
	}

	const refreshUser = async () => {
		if (!isAuthenticated.value) return

		try {
			const { users } = useApi()
			const response = await users.getMe()

			if (response.success && response.data) {
				user.value = response.data

				if (import.meta.client) {
					localStorage.setItem('auth.user', JSON.stringify(response.data))
				}
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
		initializeAuth,
		refreshUser,
	}
}
