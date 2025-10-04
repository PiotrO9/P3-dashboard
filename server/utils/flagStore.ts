import type { FlagRule } from '../../types'

export interface StoredFlag {
	id: string
	key: string
	name?: string
	type?: 'BOOLEAN' | 'PERCENTAGE' | 'CONFIG'
	enabled?: boolean
	rolloutPercentage?: number
	configJson?: any
	advancedRules?: FlagRule[]
}

const globalAny = global as any
if (!globalAny.__flagsStore) {
	globalAny.__flagsStore = new Map<string, StoredFlag>()
}

export const flagsStore: Map<string, StoredFlag> = globalAny.__flagsStore

export function findFlagByKey(key: string) {
	return [...flagsStore.values()].find(f => f.key === key)
}

// Attempt to hydrate a flag from external API if not present in store.
// Requires runtimeConfig.public.apiBase and an endpoint /flags/:id available.
export async function ensureFlagInStore(flagId: string, fetchFn: typeof $fetch, apiBase: string, token?: string) {
	if (flagsStore.has(flagId)) return flagsStore.get(flagId)!
	try {
		const headers: Record<string, string> = {}
		if (token) headers.Authorization = `Bearer ${token}`
		let remote = await fetchFn<any>(`${apiBase}/flags/${flagId}`, { headers }).catch(async (err: any) => {
			if (err?.status === 404 || err?.response?.status === 404) {
				// Try list endpoint with query param fallback
				try {
					const list = await fetchFn<any[]>(`${apiBase}/flags`, { headers })
					if (Array.isArray(list)) {
						const match = list.find(f => f.id === flagId)
						if (match) return match
					}
				} catch (_) {}
			}
			throw err
		})
		if (remote && remote.id) {
			const stored: StoredFlag = {
				id: remote.id,
				key: remote.key || remote.name || remote.id,
				name: remote.name,
				type: remote.type || 'BOOLEAN',
				enabled: remote.enabled ?? remote.isEnabled ?? true,
				rolloutPercentage: remote.rolloutPercentage,
				configJson: remote.configJson,
				advancedRules: [],
			}
			flagsStore.set(flagId, stored)
			return stored
		}
	} catch (e) {
		// silent: if external fetch fails we keep behavior (404 later)
	}
	return undefined
}
