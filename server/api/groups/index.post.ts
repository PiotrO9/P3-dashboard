import { createError, defineEventHandler, readBody } from 'h3'
import { groupsStore } from '../../utils/groupStore'

interface CreateGroupBody {
	key: string
	name: string
	description?: string
	isActive?: boolean
}

export default defineEventHandler(async event => {
	const body = await readBody<CreateGroupBody>(event)
	if (!body?.key || !body.key.trim()) throw createError({ statusCode: 400, statusMessage: 'key is required' })
	if (!body?.name || !body.name.trim()) throw createError({ statusCode: 400, statusMessage: 'name is required' })

	// uniqueness by key
	if ([...groupsStore.values()].some(g => g.key === body.key.trim())) {
		throw createError({ statusCode: 400, statusMessage: 'group key already exists' })
	}
	const id = crypto.randomUUID()
	const now = new Date().toISOString()
	const group = {
		id,
		key: body.key.trim(),
		name: body.name.trim(),
		description: body.description?.trim(),
		isActive: body.isActive ?? true,
		createdAt: now,
		updatedAt: now,
	}
	groupsStore.set(id, group)
	return { success: true, data: group }
})
