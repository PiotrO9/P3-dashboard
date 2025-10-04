<template>
	<div class="max-w-3xl mx-auto space-y-8 p-6" v-if="!loading && loaded">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Edit Group</h1>
				<p class="mt-1 text-minimal-secondary">Update name or description of this group.</p>
			</div>
			<button class="btn-minimal-ghost flex items-center gap-2 text-sm" @click="navigateTo('/groups')">
				<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" /> Back to Groups
			</button>
		</div>

		<div class="minimal-card p-6" v-if="form">
			<form @submit.prevent="save" class="space-y-8">
				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Basic Information</h3>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Group Name <span class="text-red-500">*</span></label
						>
						<input v-model="form.name" type="text" class="input-minimal w-full" />
					</div>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Group Key</label>
						<input v-model="form.key" type="text" class="input-minimal w-full font-mono text-sm" disabled />
						<p class="text-xs text-minimal-muted">Key is immutable after creation.</p>
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
						<textarea v-model="form.description" rows="3" class="input-minimal w-full resize-none" />
					</div>
				</section>

				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary flex items-center gap-2">
						Members <UBadge size="xs" variant="subtle">Future</UBadge>
					</h3>
					<p class="text-sm text-minimal-muted">User membership management for groups will be added later.</p>
					<div
						class="border border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-minimal-muted"
					>
						Coming soon
					</div>
				</section>

				<div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
					<button type="button" class="btn-minimal-ghost" @click="navigateTo('/groups')" :disabled="saving">
						Cancel
					</button>
					<button
						type="submit"
						class="btn-minimal flex items-center gap-2"
						:disabled="saving || !form.name.trim()"
					>
						<UIcon v-if="saving" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
						{{ saving ? 'Saving...' : 'Save Changes' }}
					</button>
				</div>
			</form>
		</div>

		<div v-else-if="loading" class="flex justify-center items-center py-24">
			<UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
		</div>
	</div>
	<div v-else-if="!loading && !loaded" class="p-6 text-center text-minimal-secondary">Group not found.</div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { navigateTo, useRoute } from 'nuxt/app'
import { computed, onMounted, reactive, ref } from 'vue'
import type { Group } from '../../../types'

definePageMeta({ middleware: 'auth' })

const { groups } = useApi()
const toast = useToast()
const route = useRoute()

const id = computed(() => route.params.id as string)
const loading = ref(true)
const saving = ref(false)
const loaded = ref(false)

const form = reactive<Partial<Group>>({ name: '', description: '', key: '', isActive: true })

async function load() {
	loading.value = true
	try {
		const res = await groups.getById(id.value)
		if (res.success) {
			Object.assign(form, {
				name: res.data.name,
				description: res.data.description || '',
				key: res.data.key,
				isActive: res.data.isActive,
			})
			loaded.value = true
		} else {
			loaded.value = false
		}
	} catch (e: any) {
		loaded.value = false
		toast.add({ title: 'Error', description: e.message || 'Failed to load group', color: 'red' })
	} finally {
		loading.value = false
	}
}

async function save() {
	if (!loaded.value) return
	saving.value = true
	try {
		await groups.update(id.value, {
			name: form.name,
			description: form.description,
			isActive: form.isActive,
		})
		toast.add({ title: 'Saved', description: 'Group updated successfully', color: 'green' })
		navigateTo('/groups')
	} catch (e: any) {
		toast.add({ title: 'Save failed', description: e.message || 'Could not update group', color: 'red' })
	} finally {
		saving.value = false
	}
}

onMounted(load)

useHead({ title: 'Edit Group' })
</script>
