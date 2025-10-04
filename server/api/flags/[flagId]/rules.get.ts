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

	// If still not found, create a placeholder so UI can start adding rules (demo behavior)
	if (!flag) {
		flag = {
			id: flagId,
			key: flagId,
			name: `flag-${flagId}`,
			enabled: true,
			type: 'BOOLEAN',
			advancedRules: [],
		}
		flagsStore.set(flagId, flag)
	}
	return { success: true, rules: flag.advancedRules || [] }
})
