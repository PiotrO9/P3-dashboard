import { createError, defineEventHandler, readBody } from 'h3'
import { flagsStore } from '../../utils/flagStore'

interface CreateFlagBody {
	key: string
	name?: string
	type?: 'BOOLEAN' | 'PERCENTAGE' | 'CONFIG'
	enabled?: boolean
	rolloutPercentage?: number
	configJson?: any
}

export default defineEventHandler(async event => {
	const body = await readBody<CreateFlagBody>(event)
	if (!body?.key) {
		throw createError({ statusCode: 400, statusMessage: 'key is required' })
	}
	if ([...flagsStore.values()].some(f => f.key === body.key)) {
		throw createError({ statusCode: 400, statusMessage: 'Flag key already exists' })
	}
	const id = crypto.randomUUID()
	const flag = {
		id,
		key: body.key,
		name: body.name || body.key,
		type: body.type || 'BOOLEAN',
		enabled: body.enabled ?? true,
		rolloutPercentage: body.rolloutPercentage,
		configJson: body.configJson,
		advancedRules: [],
	}
	flagsStore.set(id, flag)
	return { success: true, flag }
})
