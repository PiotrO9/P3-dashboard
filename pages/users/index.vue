<template>
	<div class="space-y-6">
		<div class="flex justify-between items-center">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Users</h1>
				<p class="mt-1 text-minimal-secondary">Manage user accounts and permissions</p>
			</div>

			<button class="btn-minimal flex items-center gap-2" @click="navigateTo('/users/new')">
				<UIcon name="i-heroicons-user-plus" class="w-4 h-4" />
				Add User
			</button>
		</div>

		<div class="minimal-card">
			<div class="flex justify-between items-center mb-6">
				<h3 class="text-lg font-medium text-minimal-primary">All Users</h3>

				<div class="relative">
					<UIcon
						name="i-heroicons-magnifying-glass"
						class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-minimal-muted"
					/>
					<input v-model="search" placeholder="Search users..." class="input-minimal pl-10 w-64" />
				</div>
			</div>

			<div class="table-minimal">
				<UTable
					v-model="selected"
					:rows="filteredUsers"
					:columns="columns"
					:loading="loading"
					:empty-state="{
						icon: 'i-heroicons-users',
						label: 'No users found',
						description: 'Get started by creating your first user account.',
					}"
					@select="onSelect"
				>
					<template #email-data="{ row }">
						<div>
							<div class="font-medium text-gray-900">{{ row.email }}</div>
							<div v-if="row.name" class="text-sm text-gray-500">{{ row.name }}</div>
						</div>
					</template>

					<template #groups-data="{ row }">
						<!-- TODO: Fetch and display user groups -->
						<UBadge color="blue" variant="soft"> {{ Math.floor(Math.random() * 3) + 1 }} groups </UBadge>
					</template>

					<template #createdAt-data="{ row }">
						<span class="text-sm text-gray-500">
							{{ new Date(row.createdAt).toLocaleDateString() }}
						</span>
					</template>

					<template #actions-data="{ row }">
						<UDropdown :items="getRowActions(row)" :popper="{ placement: 'bottom-end' }">
							<UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
						</UDropdown>
					</template>
				</UTable>

				<!-- Bulk actions -->
				<div v-if="selected.length > 0" class="mt-4 p-4 bg-blue-50 rounded-lg">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-blue-800"> {{ selected.length }} user(s) selected </span>

						<div class="flex gap-2">
							<UButton color="red" variant="outline" size="sm" @click="bulkDelete">
								Delete Selected
							</UButton>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Delete Confirmation Modal -->
		<UModal v-model="deleteModalOpen">
			<UCard>
				<template #header>
					<h3 class="text-lg font-semibold">Confirm Deletion</h3>
				</template>

				<div class="space-y-4">
					<p class="text-gray-600">
						Are you sure you want to delete this user? This action cannot be undone.
					</p>

					<div v-if="userToDelete" class="p-3 bg-red-50 rounded-lg">
						<p class="text-sm font-medium text-red-800">{{ userToDelete.email }}</p>
						<p v-if="userToDelete.name" class="text-sm text-red-600">{{ userToDelete.name }}</p>
					</div>

					<div class="flex justify-end gap-3">
						<UButton color="gray" variant="outline" @click="deleteModalOpen = false"> Cancel </UButton>

						<UButton color="red" :loading="deleting" @click="confirmDelete"> Delete User </UButton>
					</div>
				</div>
			</UCard>
		</UModal>
	</div>
</template>

<script setup lang="ts">
import { navigateTo } from 'nuxt/app'
import { computed, onMounted, ref } from 'vue'
import type { User } from '~/types'

// Add auth middleware
definePageMeta({
	middleware: 'auth',
})

const { users } = useApi()
const toast = useToast()

// Data
const usersList = ref<User[]>([])
const loading = ref(true)
const selected = ref<User[]>([])
const search = ref('')

// Delete modal
const deleteModalOpen = ref(false)
const userToDelete = ref<User | null>(null)
const deleting = ref(false)

// Table configuration
const columns = [
	{
		key: 'email',
		label: 'Email & Name',
	},
	{
		key: 'groups',
		label: 'Groups',
	},
	{
		key: 'createdAt',
		label: 'Created',
	},
	{
		key: 'actions',
		label: 'Actions',
	},
]

// Computed
const filteredUsers = computed(() => {
	if (!search.value) return usersList.value

	const searchTerm = search.value.toLowerCase()
	return usersList.value.filter(
		user => user.email.toLowerCase().includes(searchTerm) || user.name?.toLowerCase().includes(searchTerm)
	)
})

// Methods
const loadUsers = async () => {
	try {
		loading.value = true
		const response = await users.getAll()

		if (response.success) {
			usersList.value = response.data
		} else {
			throw new Error(response.message)
		}
	} catch (error: any) {
		toast.add({
			title: 'Error loading users',
			description: error.message,
			color: 'red',
		})
	} finally {
		loading.value = false
	}
}

const deleteUser = (user: User) => {
	userToDelete.value = user
	deleteModalOpen.value = true
}

const confirmDelete = async () => {
	if (!userToDelete.value) return

	try {
		deleting.value = true

		await users.delete(userToDelete.value.id)

		// Remove from local list
		usersList.value = usersList.value.filter(u => u.id !== userToDelete.value!.id)

		toast.add({
			title: 'User deleted',
			description: `${userToDelete.value.email} has been deleted`,
			color: 'green',
		})

		deleteModalOpen.value = false
		userToDelete.value = null
	} catch (error: any) {
		toast.add({
			title: 'Error deleting user',
			description: error.message,
			color: 'red',
		})
	} finally {
		deleting.value = false
	}
}

const bulkDelete = () => {
	// TODO: Implement bulk delete
	console.log('Bulk delete:', selected.value)
}

const getRowActions = (user: User) => [
	[
		{
			label: 'View Details',
			icon: 'i-heroicons-eye',
			click: () => navigateTo(`/users/${user.id}`),
		},
	],
	[
		{
			label: 'Edit',
			icon: 'i-heroicons-pencil',
			click: () => navigateTo(`/users/${user.id}/edit`),
		},
	],
	[
		{
			label: 'Delete',
			icon: 'i-heroicons-trash',
			click: () => deleteUser(user),
		},
	],
]

const onSelect = (rows: User[]) => {
	selected.value = rows
}

// Initialize
onMounted(() => {
	loadUsers()
})
</script>
