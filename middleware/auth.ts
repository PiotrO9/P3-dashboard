export default defineNuxtRouteMiddleware(to => {
	const { isAuthenticated } = useAuth()

	// If not authenticated and trying to access protected route
	if (!isAuthenticated.value) {
		return navigateTo('/login')
	}
})
