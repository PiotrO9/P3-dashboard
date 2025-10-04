import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import type { EvaluateUserContext } from '../../../types'
import { evaluateFlag } from '../../utils/evaluateFlag'
import { ensureFlagInStore, findFlagByKey, flagsStore } from '../../utils/flagStore'

interface EvaluateBody {
	flagId?: string
	key?: string
	context?: EvaluateUserContext
}

export default defineEventHandler(async event => {
	const body = await readBody<EvaluateBody>(event)
	if (!body.flagId && !body.key) {
		throw createError({ statusCode: 400, statusMessage: 'flagId or key is required' })
	}

	let flag = null as any
	if (body.flagId) {
		flag = flagsStore.get(body.flagId)
		if (!flag) {
			const config = useRuntimeConfig()
			const token = getCookie(event, 'auth.token')
			flag = await ensureFlagInStore(body.flagId, $fetch, config.public.apiBase, token || undefined)
		}
	} else if (body.key) {
		flag = findFlagByKey(body.key)
	}
	if (!flag) throw createError({ statusCode: 404, statusMessage: 'Flag not found' })

	const ctx: EvaluateUserContext = body.context || {}
	const result = evaluateFlag(flag, ctx)
	return { success: true, result }
})
