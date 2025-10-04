declare const defineNuxtPlugin: any

export default defineNuxtPlugin(function () {
	const html = document.documentElement
	const { add, toggle } = DOMTokenList.prototype

	DOMTokenList.prototype.add = function (...tokens: string[]) {
		const filtered = tokens.filter(function (t) {
			return t !== 'dark'
		})
		if (filtered.length) return add.apply(this, filtered as any)
		return undefined as any
	}

	DOMTokenList.prototype.toggle = function (token: string, force?: boolean) {
		if (token === 'dark') return this.contains('light')
		return toggle.apply(this, [token, force] as any)
	}

	function enforce() {
		if (html.classList.contains('dark')) html.classList.remove('dark')
		if (!html.classList.contains('light')) html.classList.add('light')
		html.setAttribute('data-theme', 'light')
	}

	enforce()

	new MutationObserver(function (mutations) {
		for (const m of mutations) {
			if (m.type === 'attributes' && html.classList.contains('dark')) {
				enforce()
			}
		}
	}).observe(html, { attributes: true, attributeFilter: ['class'] })
})
