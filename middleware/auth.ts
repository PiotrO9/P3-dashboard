import { defineNuxtRouteMiddleware, navigateTo, useCookie } from 'nuxt/app'

export default defineNuxtRouteMiddleware(to => {
	const userCookie = useCookie<any>('auth.user')
	const isAuthenticated = !!(userCookie.value && userCookie.value.id)

	if (!isAuthenticated) {
		const redirectTo = to.fullPath !== '/login' ? to.fullPath : '/dashboard'
		return navigateTo({ path: '/login', query: { redirect: redirectTo } })
	}
})
