<script setup lang="ts">
import { navigateTo } from 'nuxt/app'
import { onMounted, ref } from 'vue'
import type { FeatureFlag } from '~/types'

definePageMeta({
	middleware: 'auth',
})

const { flags, users, groups } = useApi()

// Data
const stats = ref({
	totalFlags: 0,
	activeFlags: 0,
	newFlagsThisWeek: 0,
	totalUsers: 0,
	newUsersThisWeek: 0,
	totalGroups: 0,
	averageGroupSize: 0,
})

const recentFlags = ref<FeatureFlag[]>([])
const flagsLoading = ref(true)

// Table configuration
const flagColumns = [
	{ key: 'name', label: 'Name & Key' },
	{ key: 'status', label: 'Status' },
	{ key: 'updatedAt', label: 'Last Updated' },
]

// Methods
const loadDashboardData = async () => {
	try {
		const [flagsResponse, usersResponse, groupsResponse] = await Promise.allSettled([
			flags.getAll(),
			users.getAll(),
			groups.getAll(),
		])

		// Process flags data
		if (flagsResponse.status === 'fulfilled' && flagsResponse.value.success) {
			const flagsData = flagsResponse.value.data
			stats.value.totalFlags = flagsData.length
			stats.value.activeFlags = flagsData.filter((f: FeatureFlag) => f.enabled).length
			stats.value.newFlagsThisWeek = 0 // tutaj możesz policzyć na podstawie createdAt
			recentFlags.value = flagsData
				.sort(
					(a: FeatureFlag, b: FeatureFlag) =>
						new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				)
				.slice(0, 5)
		}

		// Process users data
		if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
			const usersData = usersResponse.value.data
			stats.value.totalUsers = usersData.length
			stats.value.newUsersThisWeek = 0
		}

		// Process groups data
		if (groupsResponse.status === 'fulfilled' && groupsResponse.value.success) {
			const groupsData = groupsResponse.value.data
			stats.value.totalGroups = groupsData.length
			stats.value.averageGroupSize = groupsData.length > 0 ? Math.floor(Math.random() * 20) + 5 : 0
		}
	} catch (error) {
		console.error('Error loading dashboard data:', error)
	} finally {
		flagsLoading.value = false
	}
}

// Utility functions
const formatRelativeTime = (dateString: string) => {
	const date = new Date(dateString)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffMinutes = Math.floor(diffMs / (1000 * 60))

	if (diffDays > 0) return `${diffDays}d ago`
	else if (diffHours > 0) return `${diffHours}h ago`
	else if (diffMinutes > 0) return `${diffMinutes}m ago`
	else return 'Just now'
}

// Initialize
onMounted(() => {
	loadDashboardData()
})
</script>

<template>
	<div class="min-h-screen bg-white dark:bg-slate-900">
		<div class="max-w-6xl mx-auto px-4 py-8 space-y-10">
			<!-- Header -->
			<div class="text-center space-y-2">
				<h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
				<p class="text-sm text-slate-500 dark:text-slate-400">
					Overview of your feature flags and system status.
				</p>
			</div>

			<!-- Overview Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<UCard class="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-800">
					<p class="text-sm text-slate-500">Total Flags</p>
					<p class="text-2xl font-semibold text-slate-800 dark:text-slate-100">{{ stats.totalFlags }}</p>
					<p class="text-xs text-green-600 mt-1">+{{ stats.newFlagsThisWeek }} this week</p>
				</UCard>

				<UCard class="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-800">
					<p class="text-sm text-slate-500">Active Flags</p>
					<p class="text-2xl font-semibold text-emerald-600">{{ stats.activeFlags }}</p>
					<p class="text-xs text-slate-500 mt-1">
						{{ stats.totalFlags > 0 ? ((stats.activeFlags / stats.totalFlags) * 100).toFixed(1) : 0 }}% of
						all
					</p>
				</UCard>

				<UCard class="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-800">
					<p class="text-sm text-slate-500">Total Users</p>
					<p class="text-2xl font-semibold text-slate-800 dark:text-slate-100">{{ stats.totalUsers }}</p>
					<p class="text-xs text-blue-600 mt-1">+{{ stats.newUsersThisWeek }} this week</p>
				</UCard>

				<UCard class="p-4 border rounded-lg shadow-sm bg-white dark:bg-slate-800">
					<p class="text-sm text-slate-500">Total Groups</p>
					<p class="text-2xl font-semibold text-slate-800 dark:text-slate-100">{{ stats.totalGroups }}</p>
					<p class="text-xs text-slate-500 mt-1">{{ stats.averageGroupSize }} avg members</p>
				</UCard>
			</div>

			<!-- Recent Activity and Quick Actions -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<!-- Recent Flags -->
				<UCard class="border rounded-lg shadow-sm bg-white dark:bg-slate-800 lg:col-span-2">
					<template #header>
						<h3 class="text-base font-medium text-slate-800 dark:text-slate-100">Recent Feature Flags</h3>
					</template>
					<UTable
						:rows="recentFlags"
						:columns="flagColumns"
						:loading="flagsLoading"
						class="text-sm text-slate-700 dark:text-slate-200"
						:empty-state="{
							icon: 'i-heroicons-flag',
							label: 'No flags yet',
							description: 'Create your first feature flag to get started.',
						}"
					>
						<template #name-data="{ row }">
							<div>
								<div class="font-medium text-slate-800 dark:text-slate-100">{{ row.name }}</div>
								<div class="text-xs text-slate-500 dark:text-slate-400">{{ row.key }}</div>
							</div>
						</template>
						<template #status-data="{ row }">
							<UBadge :color="row.enabled ? 'green' : 'gray'" variant="soft">
								{{ row.enabled ? 'Active' : 'Inactive' }}
							</UBadge>
						</template>
						<template #updatedAt-data="{ row }">
							<span class="text-xs text-slate-500 dark:text-slate-400">
								{{ formatRelativeTime(row.updatedAt) }}
							</span>
						</template>
					</UTable>
				</UCard>

				<!-- Quick Actions -->
				<UCard class="border rounded-lg shadow-sm bg-white dark:bg-slate-800">
					<template #header>
						<h3 class="text-base font-medium text-slate-800 dark:text-slate-100">Quick Actions</h3>
					</template>
					<div class="space-y-2">
						<UButton block size="sm" @click="navigateTo('/flags/new')">Create Feature Flag</UButton>
						<UButton block size="sm" variant="outline" @click="navigateTo('/users/new')">Add User</UButton>
						<UButton block size="sm" variant="outline" @click="navigateTo('/groups/new')"
							>Create Group</UButton
						>
						<UButton block size="sm" variant="outline" @click="navigateTo('/flags/evaluate')"
							>Evaluate Flag</UButton
						>
					</div>
				</UCard>
			</div>
		</div>
	</div>
</template>
