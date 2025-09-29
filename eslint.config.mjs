// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
	rules: {
		// Enforce tab indentation
		'@stylistic/indent': ['error', 'tab'],
		'@stylistic/no-tabs': 'off',
		// Vue specific rules
		'vue/html-indent': ['error', 'tab'],
		'vue/script-indent': ['error', 'tab', { baseIndent: 0 }],
		'vue/max-attributes-per-line': 'off',
		'vue/singleline-html-element-content-newline': 'off',
		'vue/multiline-html-element-content-newline': 'off',
		// TypeScript rules
		'@typescript-eslint/no-unused-vars': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
	},
})
