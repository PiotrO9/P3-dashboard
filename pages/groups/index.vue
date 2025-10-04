<script setup lang="ts">
// @ts-nocheck
import { navigateTo } from 'nuxt/app'
import { computed, onMounted, ref } from 'vue'
import type { Group } from '../../types'

definePageMeta({ middleware: 'auth' })

const { groups } = useApi()
const toast = useToast()

const groupsList = ref<Group[]>([])
const loading = ref(true)
const search = ref('')

const columns = [
	{ key: 'name', label: 'Name & Key' },
	{ key: 'status', label: 'Status' },
	{ key: 'description', label: 'Description' },
	{ key: 'createdAt', label: 'Created' },
	{ key: 'actions', label: 'Actions' },
]

const filteredGroups = computed(() => {
	let list = groupsList.value
	if (search.value) {
		const term = search.value.toLowerCase()
		list = list.filter(
			(g: any) =>
				g.name.toLowerCase().includes(term) ||
				g.key?.toLowerCase().includes(term) ||
				g.description?.toLowerCase().includes(term)
		)
	}
	return list
})

async function loadGroups() {
	loading.value = true
	try {
		const res = await groups.getAll()
		if (res.success) groupsList.value = res.data
		else throw new Error(res.message)
	} catch (e: any) {
		toast.add({ title: 'Error', description: e.message || 'Failed to load groups', color: 'red' })
	} finally {
		loading.value = false
	}
}

function getRowActions(group: Group) {
	return [
		[
			{
				label: 'Edit',
				icon: 'i-heroicons-pencil',
				click: () => navigateTo(`/groups/${group.id}/edit`),
			},
		],
		[
			{
				label: 'Delete',
				icon: 'i-heroicons-trash',
				click: () => deleteGroup(group),
			},
		],
	]
}

async function deleteGroup(group: Group) {
	const prev = [...groupsList.value]
	groupsList.value = groupsList.value.filter((g: any) => g.id !== group.id)
	try {
		// Placeholder: internal API not yet implemented for deletion.
		// Attempt proxy call; if it fails, revert.
		const res = await groups.delete(group.id)
		if (!res?.success) throw new Error(res?.message || 'Delete failed')
		toast.add({ title: 'Group deleted', description: `"${group.name}" removed`, color: 'green' })
	} catch (e: any) {
		groupsList.value = prev
		toast.add({ title: 'Error', description: e.message || 'Failed to delete group', color: 'red' })
	}
}

onMounted(loadGroups)
</script>

<template>
	<div class="space-y-6">
		<div class="flex justify-between items-center p-6 pb-0">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Groups</h1>
				<p class="mt-1 text-minimal-secondary">Manage user groups used for targeting feature flags.</p>
			</div>
			<button class="btn-minimal flex items-center gap-2" @click="navigateTo('/groups/new')">
				<UIcon name="i-heroicons-plus" class="w-4 h-4" />
				Add Group
			</button>
		</div>

		<div class="minimal-card">
			<div class="flex justify-between items-center mb-6 gap-4 flex-wrap">
				<h3 class="text-lg font-medium text-minimal-primary">All Groups</h3>
				<div class="relative">
					<UIcon
						name="i-heroicons-magnifying-glass"
						class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-minimal-muted"
					/>
					<input v-model="search" placeholder="Search groups..." class="input-minimal pl-10 w-64" />
				</div>
			</div>

			<div class="table-minimal">
				<UTable
					:rows="filteredGroups"
					:columns="columns"
					:loading="loading"
					row-key="id"
					:empty-state="{
						icon: 'i-heroicons-user-group',
						label: 'No groups',
						description: 'Create your first group to begin grouping users.',
					}"
				>
					<template #name-data="{ row }">
						<div class="font-medium text-gray-900">{{ row.name }}</div>
						<div class="text-xs font-mono text-gray-500">{{ row.key }}</div>
					</template>
					<template #status-data="{ row }">
						<span :class="row.isActive ? 'badge-success' : 'badge-neutral'">
							{{ row.isActive ? 'Active' : 'Inactive' }}
						</span>
					</template>
					<template #description-data="{ row }">
						<span class="text-gray-600 text-sm">{{ row.description || '—' }}</span>
					</template>
					<template #createdAt-data="{ row }">
						<span class="text-xs text-gray-500">{{ new Date(row.createdAt).toLocaleDateString() }}</span>
					</template>
					<template #actions-data="{ row }">
						<UDropdown :items="getRowActions(row)" :popper="{ placement: 'bottom-end' }">
							<UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
						</UDropdown>
					</template>
				</UTable>
			</div>
		</div>
	</div>
</template>
