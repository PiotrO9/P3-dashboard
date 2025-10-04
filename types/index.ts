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
	value: any
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

export interface EvaluateAdvancedRequest {
	flagId?: string
	key?: string
	context?: EvaluateUserContext
}

export interface EvaluateAdvancedResponse<T = any> {
	success: boolean
	result: EvaluateResult<T>
}

export interface FlagEvaluationRequest {
	flagKey: string
	userId?: string
	userAttributes?: Record<string, any>
}

export interface FlagEvaluationResult<T = any> {
	success: boolean
	matched?: boolean
	value?: T | null | boolean
	result?: { matched: boolean; value: T | null | boolean }
}
