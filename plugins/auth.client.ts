import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin({
	name: 'auth-init',
	setup() {
		// This plugin ensures auth state is properly initialized
		// The useAuth composable now handles initialization automatically
		// through cookies and localStorage sync, so no explicit initialization needed
		// We can add any additional auth-related setup here if needed
		// For example: token refresh intervals, auth state persistence, etc.
	},
})
