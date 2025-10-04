<script setup lang="ts">
import { navigateTo, useRoute } from 'nuxt/app'
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, logout } = useAuth()
const route = useRoute()

const userMenuItems = [
	[{ label: user.value?.email || '', slot: 'account', disabled: true }],
	[
		{
			label: 'Dashboard',
			icon: 'i-heroicons-home',
			click: function () {
				navigateTo('/dashboard')
			},
		},
	],
	[
		{
			label: 'Profile',
			icon: 'i-heroicons-user',
			click: function () {
				navigateTo('/users/profiles')
			},
		},
	],
]

const pageTitle = computed(function () {
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

async function handleLogout() {
	try {
		await logout()
	} catch (error) {
		console.error('Logout error:', error)
	}
}
</script>

<template>
	<div class="h-screen flex minimal-container">
		<div class="flex-1 flex flex-col overflow-hidden">
			<header class="header-minimal">
				<div class="flex items-center justify-between">
					<h1 class="text-xl font-semibold text-minimal-primary">
						{{ pageTitle }}
					</h1>

					<div class="flex items-center gap-3">
						<UDropdown :items="userMenuItems" :popper="{ placement: 'bottom-end' }">
							<UButton
								color="blue"
								variant="ghost"
								:label="user?.email"
								trailing-icon="i-heroicons-chevron-down-20-solid"
							/>
						</UDropdown>

						<button class="btn-minimal-outline flex items-center gap-2 text-sm" @click="handleLogout">
							<UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
							<span class="hidden sm:flex">Logout</span>
						</button>
					</div>
				</div>
			</header>

			<main class="flex-1 overflow-y-auto bg-white">
				<slot />
			</main>
		</div>
	</div>
</template>
