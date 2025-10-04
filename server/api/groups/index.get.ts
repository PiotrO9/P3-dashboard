import { defineEventHandler } from 'h3'
import { groupsStore } from '../../utils/groupStore'

export default defineEventHandler(() => {
	return { success: true, data: [...groupsStore.values()] }
})
