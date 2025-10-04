import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, getCookie, readBody } from 'h3'
import type { AttributeFlagRule, AttributeOperator, FlagRule, GroupFlagRule, TargetingType } from '../../../../types'
import { ensureFlagInStore, flagsStore } from '../../../utils/flagStore'

export default defineEventHandler(async event => {
	const flagId = event.context.params?.flagId as string
	if (!flagId) {
		throw createError({ statusCode: 400, statusMessage: 'Missing flagId' })
	}

	let flag = flagsStore.get(flagId)
	if (!flag) {
		const config = useRuntimeConfig()
		const token = getCookie(event, 'auth.token')
		flag = await ensureFlagInStore(flagId, $fetch, config.public.apiBase, token || undefined)
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
	}

	const body = await readBody<
		Partial<FlagRule> & {
			targetingType?: TargetingType
			operator?: AttributeOperator
			value?: any
			groupId?: string
			attribute?: string
		}
	>(event)

	const { targetingType } = body
	if (!targetingType) {
		throw createError({ statusCode: 400, statusMessage: 'targetingType is required' })
	}

	let newRule: FlagRule
	if (targetingType === 'GROUP') {
		if (!body.groupId) {
			throw createError({ statusCode: 400, statusMessage: 'groupId is required for GROUP rule' })
		}
		newRule = {
			id: crypto.randomUUID(),
			flagId,
			targetingType: 'GROUP',
			groupId: body.groupId,
			createdAt: new Date().toISOString(),
		} as GroupFlagRule
	} else if (targetingType === 'ATTRIBUTE') {
		if (!body.attribute || !body.operator || body.value === undefined || body.value === null) {
			throw createError({
				statusCode: 400,
				statusMessage: 'attribute, operator and value are required for ATTRIBUTE rule',
			})
		}
		// Basic operator/value consistency checks
		const multiValueOps: AttributeOperator[] = ['IN', 'NOT_IN']
		if (multiValueOps.includes(body.operator) && !Array.isArray(body.value)) {
			throw createError({ statusCode: 400, statusMessage: `${body.operator} requires value to be an array` })
		}
		const numericOps: AttributeOperator[] = ['GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL']
		if (numericOps.includes(body.operator)) {
			const numericVal = Array.isArray(body.value) ? NaN : Number(body.value)
			if (Number.isNaN(numericVal)) {
				throw createError({ statusCode: 400, statusMessage: `${body.operator} requires value to be a number` })
			}
		}
		newRule = {
			id: crypto.randomUUID(),
			flagId,
			targetingType: 'ATTRIBUTE',
			attribute: body.attribute,
			operator: body.operator,
			value: body.value,
			createdAt: new Date().toISOString(),
		} as AttributeFlagRule
	} else {
		throw createError({ statusCode: 400, statusMessage: 'Unsupported targetingType' })
	}

	flag.advancedRules = flag.advancedRules || []
	flag.advancedRules.push(newRule)
	flagsStore.set(flagId, flag)

	return { success: true, rule: newRule }
})
