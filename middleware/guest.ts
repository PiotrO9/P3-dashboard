import { defineNuxtRouteMiddleware, navigateTo, useCookie } from 'nuxt/app'

export default defineNuxtRouteMiddleware(to => {
	const userCookie = useCookie<any>('auth.user')
	const isAuthenticated = !!(userCookie.value && userCookie.value.id)

	if (isAuthenticated) {
		const redirectTo = (to.query.redirect as string) || '/dashboard'
		return navigateTo(redirectTo)
	}
})
