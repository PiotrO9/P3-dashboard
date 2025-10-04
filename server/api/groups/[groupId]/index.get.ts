import { createError, defineEventHandler } from 'h3'
import { groupsStore } from '../../../utils/groupStore'

export default defineEventHandler(event => {
	const id = event.context.params?.groupId
	if (!id) throw createError({ statusCode: 400, statusMessage: 'groupId required' })
	const group = groupsStore.get(id)
	if (!group) throw createError({ statusCode: 404, statusMessage: 'Group not found' })
	return { success: true, data: group }
})
