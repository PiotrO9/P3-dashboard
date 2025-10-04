export interface StoredGroup {
	id: string
	key: string
	name: string
	description?: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

const globalAny = global as any
if (!globalAny.__groupsStore) {
	globalAny.__groupsStore = new Map<string, StoredGroup>()
}

export const groupsStore: Map<string, StoredGroup> = globalAny.__groupsStore
