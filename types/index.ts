export interface User {
	id: string
	email: string
	name?: string
	createdAt: string
	updatedAt: string
}

export interface Group {
	id: string
	key: string
	name: string
	description?: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

export interface FeatureFlag {
	id: string
	name: string
	key: string
	description?: string
	enabled: boolean
	// Existing simple rules (legacy) remain optional; use advancedRules for new targeting system
	rules?: Rule[]
	advancedRules?: FlagRule[]
	createdAt: string
	updatedAt: string
}

export interface Rule {
	id: string
	condition: string
	value: boolean
	flagId: string
	createdAt: string
}

// New targeting system
export type TargetingType = 'GROUP' | 'ATTRIBUTE'

export type AttributeOperator =
	| 'EQUALS'
	| 'IN'
	| 'NOT_IN'
	| 'GREATER_THAN'
	| 'LESS_THAN'
	| 'GREATER_OR_EQUAL'
	| 'LESS_OR_EQUAL'

export interface BaseFlagRule {
	id: string
	flagId: string
	targetingType: TargetingType
	createdAt: string
}

export interface GroupFlagRule extends BaseFlagRule {
	targetingType: 'GROUP'
	groupId: string
}

export interface AttributeFlagRule extends BaseFlagRule {
	targetingType: 'ATTRIBUTE'
	attribute: string
	operator: AttributeOperator
	value: any // string | number | (string | number)[] depending on operator
}

export type FlagRule = GroupFlagRule | AttributeFlagRule

export interface EvaluateUserContext {
	userId?: string
	groups?: string[]
	attributes?: Record<string, any>
}

export interface EvaluateResult<T = any> {
	matched: boolean
	value: T | null | boolean
}

export interface LoginCredentials {
	email: string
	password: string
}

export interface AuthState {
	user: User | null
	token: string | null
	isAuthenticated: boolean
}

export interface ApiResponse<T> {
	data: T
	message?: string
	success: boolean
}

export interface EvaluateRequest {
	flagKey: string
	context?: Record<string, any>
}
