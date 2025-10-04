import type { FlagRule } from '../../types'
import { evaluateFlag } from './evaluateFlag'

const flag = {
	id: 'flag_1',
	type: 'PERCENTAGE' as const,
	rolloutPercentage: 30,
	enabled: true,
	advancedRules: [
		{ id: 'r1', flagId: 'flag_1', targetingType: 'GROUP', groupId: 'beta', createdAt: new Date().toISOString() },
		{
			id: 'r2',
			flagId: 'flag_1',
			targetingType: 'ATTRIBUTE',
			attribute: 'country',
			operator: 'EQUALS',
			value: 'PL',
			createdAt: new Date().toISOString(),
		},
	] as FlagRule[],
}

const ctx = {
	userId: 'user_42',
	groups: ['beta'],
	attributes: { country: 'DE' },
}

const res = evaluateFlag(flag, ctx)
console.log('Evaluation result:', res)
