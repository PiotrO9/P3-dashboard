import { defineNuxtRouteMiddleware, navigateTo, useCookie } from 'nuxt/app'

export default defineNuxtRouteMiddleware(to => {
	// Access auth state directly from cookies
	const userCookie = useCookie<any>('auth.user')
	const tokenCookie = useCookie<string>('auth.token')

	// Check if user is authenticated
	const isAuthenticated = !!(userCookie.value && tokenCookie.value && userCookie.value.id)

	if (isAuthenticated) {
		// Check if there's a redirect query parameter
		const redirectTo = (to.query.redirect as string) || '/dashboard'

		return navigateTo(redirectTo)
	}
})
