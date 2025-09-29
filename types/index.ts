export interface User {
	id: string
	email: string
	name?: string
	createdAt: string
	updatedAt: string
}

export interface Group {
	id: string
	name: string
	description?: string
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
