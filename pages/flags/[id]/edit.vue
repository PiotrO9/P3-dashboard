<template>
	<div class="max-w-4xl mx-auto space-y-8 p-6" v-if="!loading && flagLoaded">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Edit Feature Flag</h1>
				<p class="mt-1 text-minimal-secondary">Update the configuration of this feature flag.</p>
			</div>
			<button class="btn-minimal-ghost flex items-center gap-2 text-sm" @click="navigateTo('/flags')">
				<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
				Back to Flags
			</button>
		</div>

		<div class="minimal-card p-6" v-if="flagState">
			<form @submit.prevent="updateFlag" class="space-y-8">
				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Basic Information</h3>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Flag Name <span class="text-red-500">*</span></label
						>
						<input v-model="flagState.name" type="text" class="input-minimal w-full" />
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Flag Key</label>
						<input v-model="flagState.key" type="text" class="input-minimal w-full" disabled />
						<p class="text-sm text-minimal-muted">Key cannot be changed after creation.</p>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Description</label>
						<textarea v-model="flagState.description" rows="3" class="input-minimal w-full resize-none" />
					</div>
				</section>

				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Status</h3>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Current State</label>
						<div class="flex items-center gap-3">
							<button
								type="button"
								@click="flagState.enabled = !flagState.enabled"
								:class="toggleClasses(!!flagState.enabled)"
							>
								<span :class="knobClasses(!!flagState.enabled)" />
							</button>
							<span class="text-sm text-minimal-muted">
								{{ flagState.enabled ? 'Flag is currently enabled' : 'Flag is currently disabled' }}
							</span>
						</div>
					</div>
				</section>

				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-minimal-primary">Rules</h3>
						<button
							type="button"
							class="btn-minimal-ghost flex items-center gap-2 text-sm"
							@click="addRule"
						>
							<UIcon name="i-heroicons-plus" class="w-4 h-4" />
							Add Rule
						</button>
					</div>

					<div v-if="flagState.rules && flagState.rules.length > 0" class="space-y-4">
						<div
							v-for="(rule, index) in flagState.rules"
							:key="rule.id || index"
							class="space-y-3 p-3 bg-white rounded-md border border-gray-200"
						>
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Rule {{ index + 1 }}</span>
								<button
									type="button"
									class="btn-minimal-ghost flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
									@click="removeRule(index)"
								>
									<UIcon name="i-heroicons-trash" class="w-4 h-4" />
									Remove
								</button>
							</div>

							<div class="space-y-2">
								<label class="text-sm font-medium text-minimal-primary">Condition</label>
								<input
									v-model="rule.condition"
									type="text"
									placeholder="e.g., user.role == 'admin'"
									class="input-minimal w-full"
								/>
							</div>

							<div class="space-y-2 flex gap-2 items-end">
								<label class="text-sm font-medium text-minimal-primary">Value</label>
								<button
									type="button"
									@click="rule.value = !rule.value"
									:class="toggleClasses(rule.value)"
								>
									<span :class="knobClasses(rule.value)" />
								</button>
								<p class="text-sm text-minimal-muted">
									{{
										rule.value
											? 'Enable flag when condition is met'
											: 'Disable flag when condition is met'
									}}
								</p>
							</div>
						</div>
					</div>
					<div v-else class="text-sm text-minimal-muted">No rules defined for this flag.</div>
				</section>

				<div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
					<button type="button" class="btn-minimal-ghost" @click="navigateTo('/flags')" :disabled="saving">
						Cancel
					</button>
					<button type="submit" class="btn-minimal flex items-center gap-2" :disabled="saving">
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
	<div v-else class="p-6 text-center text-minimal-secondary">Flag not found.</div>
</template>

<script setup lang="ts">
import { navigateTo, useRoute } from 'nuxt/app'
import { computed, onMounted, reactive, ref } from 'vue'
import type { FeatureFlag, Rule } from '../../../types'

// Nuxt auto-imports: definePageMeta, useHead, useApi, useToast

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const { flags } = useApi()
const toast = useToast()

const id = computed(() => route.params.id as string)
const loading = ref(true)
const saving = ref(false)
const flagLoaded = ref(false)

const flagState = reactive<Partial<FeatureFlag> & { rules: Array<{ id?: string; condition: string; value: boolean }> }>(
	{
		name: '',
		key: '',
		description: '',
		enabled: false,
		rules: [],
	}
)

function toggleClasses(active: boolean) {
	return [
		'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
		active ? 'bg-blue-600 focus:ring-blue-500' : 'bg-gray-300 focus:ring-gray-400',
	]
}
function knobClasses(active: boolean) {
	return [
		'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
		active ? 'translate-x-6' : 'translate-x-1',
	]
}

function addRule() {
	if (!flagState) return
	flagState.rules = flagState.rules || []
	flagState.rules.push({ condition: '', value: true })
}
function removeRule(index: number) {
	if (!flagState || !flagState.rules) return
	flagState.rules.splice(index, 1)
}

async function loadFlag() {
	try {
		loading.value = true
		const res = await flags.getById(id.value)
		if (res.success) {
			const f = res.data
			Object.assign(flagState, {
				...f,
				rules: f.rules ? f.rules.map((r: Rule) => ({ id: r.id, condition: r.condition, value: r.value })) : [],
			})
			flagLoaded.value = true
		} else {
			flagLoaded.value = false
		}
	} catch (e: any) {
		toast.add({ title: 'Error', description: e.message || 'Failed to load flag', color: 'red' })
		flagLoaded.value = false
	} finally {
		loading.value = false
	}
}

async function updateFlag() {
	if (!flagLoaded.value) return
	saving.value = true
	try {
		const payload: any = {
			name: flagState.name,
			description: flagState.description,
			enabled: flagState.enabled,
			rules: flagState.rules?.map((r: any) => ({ id: r.id, condition: r.condition, value: r.value })),
		}
		await flags.update(id.value, payload)
		toast.add({ title: 'Success', description: 'Flag updated successfully', color: 'green' })
		navigateTo('/flags')
	} catch (e: any) {
		toast.add({ title: 'Update failed', description: e.message || 'Could not update flag', color: 'red' })
	} finally {
		saving.value = false
	}
}

onMounted(loadFlag)
</script>
