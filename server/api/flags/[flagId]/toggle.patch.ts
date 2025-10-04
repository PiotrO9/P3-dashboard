import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, getCookie } from 'h3'
import { ensureFlagInStore, flagsStore } from '../../../utils/flagStore'

export default defineEventHandler(async event => {
	const flagId = event.context.params?.flagId as string
	if (!flagId) throw createError({ statusCode: 400, statusMessage: 'Missing flagId' })

	let flag = flagsStore.get(flagId)
	if (!flag) {
		const config = useRuntimeConfig()
		const token = getCookie(event, 'auth.token')
		flag = await ensureFlagInStore(flagId, $fetch, config.public.apiBase, token || undefined)
	}
	if (!flag) throw createError({ statusCode: 404, statusMessage: 'Flag not found' })

	const config = useRuntimeConfig()
	const token = getCookie(event, 'auth.token')
	let externalUpdated: any = null
	try {
		const headers: Record<string, string> = {}
		if (token) headers.Authorization = `Bearer ${token}`
		try {
			externalUpdated = await $fetch<any>(`${config.public.apiBase}/flags/${flagId}/toggle`, {
				method: 'PATCH',
				headers,
			})
		} catch (ePatch: any) {
			if (ePatch?.response?.status === 405 || ePatch?.response?.status === 404) {
				try {
					externalUpdated = await $fetch<any>(`${config.public.apiBase}/flags/${flagId}/toggle`, {
						method: 'POST',
						headers,
					})
				} catch (_) {}
			}
		}
	} catch (err: any) {}

	if (externalUpdated && (externalUpdated.enabled !== undefined || externalUpdated.isEnabled !== undefined)) {
		flag.enabled = externalUpdated.enabled ?? externalUpdated.isEnabled
	} else {
		flag.enabled = !flag.enabled
	}

	flagsStore.set(flagId, flag)
	return { success: true, data: { id: flag.id, enabled: flag.enabled, key: flag.key, name: flag.name } }
})
