<template>
	<div class="max-w-3xl mx-auto space-y-8 p-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Create New Group</h1>
				<p class="mt-1 text-minimal-secondary">
					Define a user group that can be used in feature flag targeting rules.
				</p>
			</div>
			<button class="text-sm btn-minimal-ghost flex items-center gap-2" @click="navigateTo('/groups')">
				<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
				Back to Groups
			</button>
		</div>

		<div class="minimal-card p-6">
			<form @submit.prevent="createGroup" class="space-y-8">
				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Basic Information</h3>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Group Name <span class="text-red-500">*</span></label
						>
						<input
							v-model="form.name"
							type="text"
							placeholder="e.g., Beta Testers"
							class="input-minimal w-full"
							@input="generateKey"
						/>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Group Key <span class="text-red-500">*</span></label
						>
						<input
							v-model="form.key"
							type="text"
							class="input-minimal w-full font-mono text-sm"
							placeholder="auto-generated-from-name"
						/>
						<p class="text-xs text-minimal-muted">Unique key identifier (can edit before creating).</p>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Active</label>
						<div class="flex items-center gap-3">
							<button
								type="button"
								@click="form.isActive = !form.isActive"
								:class="[
									'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
									form.isActive
										? 'bg-blue-600 focus:ring-blue-500'
										: 'bg-gray-300 focus:ring-gray-400',
								]"
							>
								<span
									:class="[
										'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
										form.isActive ? 'translate-x-6' : 'translate-x-1',
									]"
								/>
							</button>
							<span class="text-sm text-minimal-muted">{{
								form.isActive ? 'Group is active' : 'Group is inactive'
							}}</span>
						</div>
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Description</label>
						<textarea
							v-model="form.description"
							rows="3"
							class="input-minimal w-full resize-none"
							placeholder="Optional group description..."
						></textarea>
					</div>
				</section>

				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary flex items-center gap-2">
						Members (Preview Only)
						<UBadge size="xs" variant="subtle">Future</UBadge>
					</h3>
					<p class="text-sm text-minimal-muted">
						User membership management is not implemented yet. This section is a placeholder for future
						functionality.
					</p>
					<div
						class="border border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-minimal-muted"
					>
						Coming soon
					</div>
				</section>

				<div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
					<button type="button" class="btn-minimal-ghost" @click="navigateTo('/groups')" :disabled="creating">
						Cancel
					</button>
					<button
						type="submit"
						class="btn-minimal flex items-center gap-2"
						:disabled="creating || !form.name.trim()"
					>
						<UIcon v-if="creating" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
						{{ creating ? 'Creating...' : 'Create Group' }}
					</button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { navigateTo } from 'nuxt/app'
import { reactive, ref } from 'vue'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const creating = ref(false)
const { groups } = useApi()

const form = reactive({
	name: '',
	key: '',
	description: '',
	isActive: true,
})

function generateKey() {
	if (!form.key && form.name) {
		form.key = form.name
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 60)
	}
}

async function createGroup() {
	if (!form.name.trim()) return
	creating.value = true
	try {
		if (!form.key) generateKey()
		const res = await groups.create({
			key: form.key.trim(),
			name: form.name.trim(),
			description: form.description?.trim() || undefined,
			isActive: form.isActive,
		})
		if (!res?.success) throw new Error(res?.message || 'Creation failed')
		toast.add({ title: 'Success', description: `Group "${res.data.name}" created.`, color: 'green' })
		navigateTo('/groups')
	} catch (error: any) {
		console.error('Error creating group:', error)
		toast.add({ title: 'Error', description: error.message || 'Failed to create group.', color: 'red' })
	} finally {
		creating.value = false
	}
}

useHead({ title: 'Create New Group' })
</script>
