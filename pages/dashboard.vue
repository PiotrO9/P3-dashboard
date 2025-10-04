<script setup lang="ts">
import { navigateTo } from 'nuxt/app'
import { onMounted, ref } from 'vue'
import type { FeatureFlag } from '~/types'

definePageMeta({
	middleware: 'auth',
})

const { flags, users, groups } = useApi()

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

const flagColumns = [
	{ key: 'name', label: 'Name & Key' },
	{ key: 'status', label: 'Status' },
	{ key: 'updatedAt', label: 'Last Updated' },
]

async function loadDashboardData() {
	try {
		const [flagsResponse, usersResponse, groupsResponse] = await Promise.allSettled([
			flags.getAll(),
			users.getAll(),
			groups.getAll(),
		])

		if (flagsResponse.status === 'fulfilled' && flagsResponse.value.success) {
			const flagsData = flagsResponse.value.data
			stats.value.totalFlags = flagsData.length
			stats.value.activeFlags = flagsData.filter(function (f: FeatureFlag) {
				return f.enabled
			}).length
			stats.value.newFlagsThisWeek = 0
			recentFlags.value = flagsData
				.sort(function (a: FeatureFlag, b: FeatureFlag) {
					return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
				})
				.slice(0, 5)
		}

		if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
			const usersData = usersResponse.value.data
			stats.value.totalUsers = usersData.length
			stats.value.newUsersThisWeek = 0
		}

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

function formatRelativeTime(dateString: string) {
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

onMounted(function () {
	loadDashboardData()
})
</script>

<template>
	<div class="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
		<div class="max-w-6xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8 py-10">
			<div class="text-center space-y-2">
				<div
					class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2"
				>
					<UIcon name="i-heroicons-chart-bar" class="w-6 h-6" />
				</div>
				<h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
				<p class="text-gray-500">Overview of your feature flags and system status.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<div class="minimal-card minimal-card-hover transition hover:shadow-md hover:-translate-y-0.5">
					<div class="flex items-center gap-2 mb-2 text-gray-500">
						<UIcon name="i-heroicons-flag" class="w-4 h-4" />
						<p class="text-sm">Total Flags</p>
					</div>
					<p class="text-2xl font-semibold text-gray-900">{{ stats.totalFlags }}</p>
				</div>

				<div class="minimal-card minimal-card-hover transition hover:shadow-md hover:-translate-y-0.5">
					<div class="flex items-center gap-2 mb-2 text-gray-500">
						<UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
						<p class="text-sm">Active Flags</p>
					</div>
					<p class="text-2xl font-semibold text-green-600">{{ stats.activeFlags }}</p>
				</div>

				<div class="minimal-card minimal-card-hover transition hover:shadow-md hover:-translate-y-0.5">
					<div class="flex items-center gap-2 mb-2 text-gray-500">
						<UIcon name="i-heroicons-users" class="w-4 h-4" />
						<p class="text-sm">Total Users</p>
					</div>
					<p class="text-2xl font-semibold text-gray-900">{{ stats.totalUsers }}</p>
				</div>

				<div class="minimal-card minimal-card-hover transition hover:shadow-md hover:-translate-y-0.5">
					<div class="flex items-center gap-2 mb-2 text-gray-500">
						<UIcon name="i-heroicons-user-group" class="w-4 h-4" />
						<p class="text-sm">Total Groups</p>
					</div>
					<p class="text-2xl font-semibold text-gray-900">{{ stats.totalGroups }}</p>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div class="minimal-card lg:col-span-2">
					<div class="flex justify-between items-start">
						<h3 class="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
							Recent Feature Flags
						</h3>

						<NuxtLink to="/flags" class="text-lg text-blue-600 hover:underline"> View All </NuxtLink>
					</div>
					<div class="table-minimal">
						<UTable
							:rows="recentFlags"
							:columns="flagColumns"
							:loading="flagsLoading"
							class="text-sm text-red-600"
							:empty-state="{
								icon: 'i-heroicons-flag',
								label: 'No flags yet',
								description: 'Create your first feature flag to get started.',
							}"
						>
							<template #name-data="{ row }">
								<div>
									<div class="font-medium text-gray-900">{{ row.name }}</div>
									<div class="text-xs text-gray-00">{{ row.key }}</div>
								</div>
							</template>
							<template #status-data="{ row }">
								<span :class="row.enabled ? 'badge-success' : 'badge-neutral'">
									{{ row.enabled ? 'Active' : 'Inactive' }}
								</span>
							</template>
							<template #updatedAt-data="{ row }">
								<span class="text-xs text-gray-500">
									{{ formatRelativeTime(row.updatedAt) }}
								</span>
							</template>
						</UTable>
					</div>
				</div>

				<div class="minimal-card">
					<h3 class="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">
						Quick Actions
					</h3>
					<div class="space-y-3">
						<button class="btn-minimal w-full" @click="navigateTo('/flags')">Flags</button>
						<button class="btn-minimal-outline w-full" @click="navigateTo('/groups')">Groups</button>
						<button class="btn-minimal-outline w-full" @click="navigateTo('/flags/evaluate')">
							Evaluate Flag
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
