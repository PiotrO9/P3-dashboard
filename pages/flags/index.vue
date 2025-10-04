<script setup lang="ts">
import { navigateTo } from 'nuxt/app'
import { onMounted, ref } from 'vue'
import { z } from 'zod'
import type { FeatureFlag } from '~/types'

definePageMeta({
	middleware: 'auth',
})

const { flags } = useApi()
const toast = useToast()

const flagsList = ref<FeatureFlag[]>([])
const loading = ref(true)
const toggleLoading = ref<Record<string, boolean>>({})
// Row selection removed – no multi-select state needed

const search = ref('')
const statusFilter = ref('')

const statusOptions = [
	{ label: 'All', value: '' },
	{ label: 'Enabled', value: 'enabled' },
	{ label: 'Disabled', value: 'disabled' },
]

const columns = [
	{
		key: 'name',
		label: 'Name & Key',
	},
	{
		key: 'enabled',
		label: 'Status',
	},
	{
		key: 'description',
		label: 'Description',
	},
	{
		key: 'rules',
		label: 'Rules',
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

const rulesModalOpen = ref(false)
const selectedFlag = ref<FeatureFlag | null>(null)

const ruleSchema = z.object({
	condition: z.string().min(1, 'Condition is required'),
	value: z.boolean(),
})

const ruleState = reactive({
	condition: '',
	value: true,
})

const filteredFlags = computed(function () {
	let filtered = flagsList.value

	if (search.value) {
		const searchTerm = search.value.toLowerCase()
		filtered = filtered.filter(function (flag: FeatureFlag) {
			return (
				flag.name.toLowerCase().includes(searchTerm) ||
				flag.key.toLowerCase().includes(searchTerm) ||
				flag.description?.toLowerCase().includes(searchTerm)
			)
		})
	}

	if (statusFilter.value) {
		filtered = filtered.filter(function (flag: FeatureFlag) {
			if (statusFilter.value === 'enabled') return flag.enabled
			if (statusFilter.value === 'disabled') return !flag.enabled
			return true
		})
	}

	return filtered
})

async function loadFlags() {
	try {
		loading.value = true
		const response = await flags.getAll()

		if (response.success) {
			flagsList.value = response.data
		} else {
			throw new Error(response.message)
		}
	} catch (error: any) {
		toast.add({
			title: 'Error loading flags',
			description: error.message,
			color: 'red',
		})
	} finally {
		loading.value = false
	}
}

async function toggleFlag(flag: FeatureFlag) {
	try {
		toggleLoading.value[flag.id] = true

		const response = await flags.toggle(flag.id)

		if (response.success) {
			const index = flagsList.value.findIndex(function (f: FeatureFlag) {
				return f.id === flag.id
			})
			if (index !== -1) {
				// Preserve the same reactive object reference so table & selection don't lose DOM anchors
				Object.assign(flagsList.value[index], response.data)
			}

			toast.add({
				title: `Flag ${response.data.enabled ? 'enabled' : 'disabled'}`,
				description: `"${flag.name}" is now ${response.data.enabled ? 'enabled' : 'disabled'}`,
				color: response.data.enabled ? 'green' : 'orange',
			})
		}
	} catch (error: any) {
		flag.enabled = !flag.enabled

		toast.add({
			title: 'Error toggling flag',
			description: error.message,
			color: 'red',
		})
	} finally {
		toggleLoading.value[flag.id] = false
	}
}

// bulkToggle & selection removed

function showRules(flag: FeatureFlag) {
	selectedFlag.value = flag
	rulesModalOpen.value = true
}

async function addRule() {
	if (!selectedFlag.value) return

	try {
		const response = await flags.addRule(selectedFlag.value.id, ruleState)

		if (response.success) {
			await loadFlags()
			ruleState.condition = ''
			ruleState.value = true

			toast.add({
				title: 'Rule added',
				description: 'Rule has been successfully added',
				color: 'green',
			})
		}
	} catch (error: any) {
		toast.add({
			title: 'Error adding rule',
			description: error.message,
			color: 'red',
		})
	}
}

async function deleteRule(flagId: string, ruleId: string) {
	try {
		await flags.deleteRule(flagId, ruleId)

		await loadFlags()

		toast.add({
			title: 'Rule deleted',
			description: 'Rule has been successfully deleted',
			color: 'green',
		})
	} catch (error: any) {
		toast.add({
			title: 'Error deleting rule',
			description: error.message,
			color: 'red',
		})
	}
}

function getRowActions(flag: FeatureFlag) {
	return [
		[
			{
				label: 'Edit',
				icon: 'i-heroicons-pencil',
				click: function () {
					navigateTo(`/flags/${flag.id}/edit`)
				},
			},
		],
		[
			{
				label: 'Delete',
				icon: 'i-heroicons-trash',
				click: function () {
					console.log('Delete flag:', flag.id)
				},
			},
		],
	]
}

// onSelect removed – table no longer exposes selection

onMounted(function () {
	loadFlags()
})
</script>

<template>
	<div class="space-y-6">
		<div class="flex justify-between items-center p-6 pb-0">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Feature Flags</h1>
				<p class="mt-1 text-minimal-secondary">Manage and toggle your feature flags</p>
			</div>

			<button class="btn-minimal flex items-center gap-2" @click="navigateTo('/flags/new')">
				<UIcon name="i-heroicons-plus" class="w-4 h-4" />
				Add Flag
			</button>
		</div>

		<div class="minimal-card">
			<div class="flex justify-between items-center mb-6">
				<h3 class="text-lg font-medium text-minimal-primary">All Flags</h3>

				<div class="flex gap-3">
					<div class="relative">
						<UIcon
							name="i-heroicons-magnifying-glass"
							class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-minimal-muted"
						/>
						<input v-model="search" placeholder="Search flags..." class="input-minimal pl-10 w-64" />
					</div>

					<select v-model="statusFilter" class="input-minimal w-40">
						<option value="">All statuses</option>
						<option v-for="option in statusOptions" :key="option.value" :value="option.value">
							{{ option.label }}
						</option>
					</select>
				</div>
			</div>

			<div class="table-minimal">
				<UTable
					:model-value="[]"
					:rows="filteredFlags"
					:columns="columns"
					:loading="loading"
					row-key="id"
					:empty-state="{
						icon: 'i-heroicons-flag',
						label: 'No flags found',
						description: 'Create your first feature flag to get started.',
					}"
					class="w-full"
				>
					<template #name-data="{ row }">
						<div>
							<div class="font-medium text-gray-900">{{ row.name }}</div>
							<div class="text-sm text-gray-500">{{ row.key }}</div>
						</div>
					</template>

					<template #enabled-data="{ row }">
						<UToggle
							v-model="row.enabled"
							:loading="toggleLoading[row.id]"
							@update:model-value="toggleFlag(row)"
						/>
					</template>

					<template #description-data="{ row }">
						<span class="text-gray-600 truncate max-w-xs block">
							{{ row.description || 'No description' }}
						</span>
					</template>

					<template #rules-data="{ row }">
						<div class="flex items-center gap-2">
							<UBadge :color="row.rules?.length ? 'blue' : 'gray'" variant="soft">
								{{ row.rules?.length || 0 }} rules
							</UBadge>

							<UButton v-if="row.rules?.length" variant="ghost" size="xs" @click="showRules(row)">
								View
							</UButton>
						</div>
					</template>

					<template #actions-data="{ row }">
						<UDropdown :items="getRowActions(row)" :popper="{ placement: 'bottom-end' }">
							<UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal" />
						</UDropdown>
					</template>

					<template #createdAt-data="{ row }">
						<span class="text-sm text-gray-500">
							{{ new Date(row.createdAt).toLocaleDateString() }}
						</span>
					</template>
				</UTable>

				<!-- Bulk selection UI removed -->
			</div>

			<UModal v-model="rulesModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
				<UCard>
					<template #header>
						<div class="flex justify-between items-center">
							<h3 class="text-lg font-semibold">Rules for "{{ selectedFlag?.name }}"</h3>
							<UButton
								color="gray"
								variant="ghost"
								icon="i-heroicons-x-mark"
								@click="rulesModalOpen = false"
							/>
						</div>
					</template>

					<div class="space-y-4">
						<div v-if="selectedFlag?.rules?.length" class="space-y-2">
							<div
								v-for="rule in selectedFlag.rules"
								:key="rule.id"
								class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
							>
								<div>
									<code class="text-sm">{{ rule.condition }}</code>
									<p class="text-xs text-gray-500 mt-1">
										Returns: {{ rule.value ? 'true' : 'false' }}
									</p>
								</div>

								<UButton
									color="red"
									variant="ghost"
									size="xs"
									icon="i-heroicons-trash"
									@click="deleteRule(selectedFlag.id, rule.id)"
								>
									Delete
								</UButton>
							</div>
						</div>

						<div v-else class="text-center py-8 text-gray-500">No rules configured for this flag</div>

						<UForm :schema="ruleSchema" :state="ruleState" @submit="addRule">
							<div class="grid grid-cols-2 gap-4">
								<UFormGroup label="Condition" name="condition">
									<UInput v-model="ruleState.condition" placeholder="user.role === 'admin'" />
								</UFormGroup>

								<UFormGroup label="Return Value" name="value">
									<USelect
										v-model="ruleState.value"
										:options="[
											{ label: 'True', value: true },
											{ label: 'False', value: false },
										]"
									/>
								</UFormGroup>
							</div>

							<UButton type="submit" class="mt-4">Add Rule</UButton>
						</UForm>
					</div>
				</UCard>
			</UModal>
		</div>
	</div>
</template>
