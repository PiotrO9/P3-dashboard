export default defineNuxtConfig({
	modules: ['@nuxt/ui', '@nuxt/eslint'],
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	app: {
		head: {
			htmlAttrs: { class: 'light' },
			meta: [{ name: 'color-scheme', content: 'light' }],
		},
	},
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
