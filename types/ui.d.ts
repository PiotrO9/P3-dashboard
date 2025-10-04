declare module 'nuxt/schema' {
	interface NuxtConfig {
		ui?: {
			global?: boolean
			icons?: string[]
		}
		eslint?: {
			config?: any
		}
	}
	interface NuxtOptions {
		ui?: {
			global?: boolean
			icons?: string[]
		}
		eslint?: {
			config?: any
		}
	}
}
export {}
