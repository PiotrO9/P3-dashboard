import { createError, defineEventHandler } from 'h3'
import { flagsStore } from '../../../utils/flagStore'

export default defineEventHandler(async event => {
	const ruleId = event.context.params?.ruleId as string
	if (!ruleId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing ruleId' })
	}

	let removed = false
	for (const [flagId, flag] of flagsStore.entries()) {
		if (flag.advancedRules) {
			const idx = flag.advancedRules.findIndex(r => r.id === ruleId)
			if (idx !== -1) {
				flag.advancedRules.splice(idx, 1)
				flagsStore.set(flagId, flag)
				removed = true
				break
			}
		}
	}

	if (!removed) {
		throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
	}

	return { success: true }
})
