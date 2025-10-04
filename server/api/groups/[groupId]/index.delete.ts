import { createError, defineEventHandler } from 'h3'
import { groupsStore } from '../../../utils/groupStore'

export default defineEventHandler(event => {
	const id = event.context.params?.groupId
	if (!id) throw createError({ statusCode: 400, statusMessage: 'groupId required' })
	if (!groupsStore.has(id)) throw createError({ statusCode: 404, statusMessage: 'Group not found' })
	groupsStore.delete(id)
	return { success: true }
})
