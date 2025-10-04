import type { AttributeFlagRule, EvaluateResult, EvaluateUserContext, FlagRule } from '../../types'

export interface FlagLike {
	id: string
	key?: string
	enabled?: boolean
	type?: 'BOOLEAN' | 'PERCENTAGE' | 'CONFIG'
	rolloutPercentage?: number // for PERCENTAGE
	configJson?: any // for CONFIG
	advancedRules?: FlagRule[]
}

function ruleMatches(rule: FlagRule, ctx: EvaluateUserContext): boolean {
	if (rule.targetingType === 'GROUP') {
		if (!ctx.groups) return false
		return ctx.groups.includes(rule.groupId)
	}
	// ATTRIBUTE
	const attrRule = rule as AttributeFlagRule
	const value = ctx.attributes?.[attrRule.attribute]
	const target = attrRule.value
	switch (attrRule.operator) {
		case 'EQUALS':
			return value === target
		case 'IN':
			return Array.isArray(target) && target.includes(value)
		case 'NOT_IN':
			return Array.isArray(target) && !target.includes(value)
		case 'GREATER_THAN':
			return Number(value) > Number(target)
		case 'LESS_THAN':
			return Number(value) < Number(target)
		case 'GREATER_OR_EQUAL':
			return Number(value) >= Number(target)
		case 'LESS_OR_EQUAL':
			return Number(value) <= Number(target)
		default:
			return false
	}
}

export function evaluateFlag(flag: FlagLike, ctx: EvaluateUserContext): EvaluateResult<any> {
	const rules = flag.advancedRules || []
	let matched = false
	if (rules.length === 0) {
		matched = true
	} else {
		matched = rules.some(r => ruleMatches(r, ctx))
	}

	if (!matched) {
		switch (flag.type) {
			case 'BOOLEAN':
				return { matched, value: false }
			case 'PERCENTAGE':
				return { matched, value: false }
			case 'CONFIG':
				return { matched, value: null }
			default:
				return { matched, value: null }
		}
	}

	// matched
	switch (flag.type) {
		case 'BOOLEAN':
			return { matched: true, value: !!flag.enabled }
		case 'PERCENTAGE':
			if (!ctx.userId || typeof flag.rolloutPercentage !== 'number') {
				return { matched: true, value: false }
			}
			const hashed = hashString(ctx.userId)
			const pct = hashed % 100
			return { matched: true, value: pct < flag.rolloutPercentage }
		case 'CONFIG':
			return { matched: true, value: flag.configJson ?? null }
		default:
			return { matched: true, value: null }
	}
}

function hashString(str: string): number {
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i)
		hash |= 0 // Convert to 32bit integer
	}
	return Math.abs(hash)
}
