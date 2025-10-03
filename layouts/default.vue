<script setup lang="ts">
import { navigateTo, useRoute } from 'nuxt/app'
import { computed, onMounted } from 'vue'

const { user, logout } = useAuth()
const route = useRoute()

const userMenuItems = [
	[{ label: user.value?.email || '', slot: 'account', disabled: true }],
	[{ label: 'Profile', icon: 'i-heroicons-user', click: () => navigateTo('/users/profile') }],
	[{ label: 'Settings', icon: 'i-heroicons-cog-6-tooth', click: () => console.log('Settings') }],
]

const pageTitle = computed(() => {
	const pathSegments = route.path.split('/').filter(Boolean)

	if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
		return 'Dashboard'
	}

	const titles: Record<string, string> = {
		flags: 'Feature Flags',
		users: 'Users',
		groups: 'Groups',
	}

	return titles[pathSegments[0]] || 'Admin Panel'
})

const handleLogout = async () => {
	try {
		await logout()
	} catch (error) {
		console.error('Logout error:', error)
	}
}

onMounted(() => {
	const { initializeAuth } = useAuth()
	initializeAuth()
})
</script>

<template>
	<div class="h-screen flex">
		<div class="flex-1 flex flex-col overflow-hidden">
			<header class="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-3">
				<div class="flex items-center justify-between">
					<h1 class="text-lg font-medium text-gray-900 dark:text-gray-100">
						{{ pageTitle }}
					</h1>

					<div class="flex items-center gap-3">
						<UDropdown v-if="user" :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
							<UButton
								color="gray"
								variant="ghost"
								:label="user.email"
								trailing-icon="i-heroicons-chevron-down-20-solid"
								size="sm"
							/>
						</UDropdown>

						<UButton
							color="red"
							variant="outline"
							icon="i-heroicons-arrow-right-on-rectangle"
							size="sm"
							@click="handleLogout"
						>
							Logout
						</UButton>
					</div>
				</div>
			</header>

			<main class="flex-1 overflow-y-auto p-6">
				<slot />
			</main>
		</div>
	</div>
</template>
