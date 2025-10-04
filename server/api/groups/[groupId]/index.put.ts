import { createError, defineEventHandler, readBody } from 'h3'
import { groupsStore } from '../../../utils/groupStore'

interface UpdateGroupBody {
	name?: string
	description?: string
	isActive?: boolean
}

export default defineEventHandler(async event => {
	const id = event.context.params?.groupId
	if (!id) throw createError({ statusCode: 400, statusMessage: 'groupId required' })
	const existing = groupsStore.get(id)
	if (!existing) throw createError({ statusCode: 404, statusMessage: 'Group not found' })
	const body = await readBody<UpdateGroupBody>(event)
	if (body.name !== undefined) existing.name = body.name.trim() || existing.name
	if (body.description !== undefined) existing.description = body.description?.trim() || undefined
	if (typeof body.isActive === 'boolean') existing.isActive = body.isActive
	existing.updatedAt = new Date().toISOString()
	groupsStore.set(id, existing)
	return { success: true, data: existing }
})
