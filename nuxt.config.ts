// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: ['@nuxt/ui', '@nuxt/eslint'],
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	ui: {
		global: true,
		icons: ['heroicons'],
	},
	runtimeConfig: {
		public: {
			apiBase: process.env.API_BASE_URL || 'http://localhost:3001',
		},
	},
	typescript: {
		strict: true,
	},
	eslint: {
		config: {
			stylistic: {
				indent: ['tab', 4],
				semi: false,
				quotes: 'single',
			},
		},
	},
})
