<template>
	<div class="max-w-4xl mx-auto space-y-8 p-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Create New Feature Flag</h1>
				<p class="mt-1 text-minimal-secondary">Add a new feature flag to control application features.</p>
			</div>
			<button class="btn-minimal-ghost flex items-center gap-2 text-sm" @click="navigateTo('/flags')">
				<UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
				Back to Flags
			</button>
		</div>

		<div class="minimal-card p-6">
			<form @submit.prevent="createFlag" class="space-y-8">
				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Basic Information</h3>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Flag Name <span class="text-red-500">*</span></label
						>
						<input
							v-model="flagState.name"
							type="text"
							placeholder="e.g., New Dashboard UI"
							class="input-minimal w-full"
							@input="generateKey"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary"
							>Flag Key <span class="text-red-500">*</span></label
						>
						<input
							v-model="flagState.key"
							type="text"
							placeholder="e.g., feature.new-dashboard-ui"
							class="input-minimal w-full"
						/>
						<p class="text-sm text-minimal-muted">
							Unique identifier for this flag (auto-generated from name)
						</p>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Description</label>
						<textarea
							v-model="flagState.description"
							rows="3"
							placeholder="Describe what this feature flag controls..."
							class="input-minimal w-full resize-none"
						></textarea>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Flag Type</label>
						<select v-model="flagState.type" class="input-minimal w-full">
							<option value="BOOLEAN">Boolean</option>
							<option value="PERCENTAGE">Percentage</option>
							<option value="CONFIG">Config</option>
						</select>
					</div>

					<div v-if="flagState.type === 'PERCENTAGE'" class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Rollout Percentage</label>
						<input
							v-model.number="flagState.rolloutPercentage"
							type="number"
							min="0"
							max="100"
							class="input-minimal w-full"
							placeholder="Enter rollout percentage (0-100)"
						/>
					</div>

					<div v-if="flagState.type === 'CONFIG'" class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Config JSON</label>
						<textarea
							v-model="flagState.configJsonText"
							rows="5"
							class="input-minimal w-full font-mono text-sm resize-none"
							placeholder='{ "theme": "dark", "betaUser": true }'
						></textarea>
					</div>
				</section>

				<section class="space-y-6">
					<h3 class="text-lg font-medium text-minimal-primary">Status</h3>
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Initial State</label>
						<div class="flex items-center gap-3">
							<button
								type="button"
								@click="flagState.isEnabled = !flagState.isEnabled"
								:class="[
									'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
									flagState.isEnabled
										? 'bg-blue-600 focus:ring-blue-500'
										: 'bg-gray-300 focus:ring-gray-400',
								]"
							>
								<span
									:class="[
										'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
										flagState.isEnabled ? 'translate-x-6' : 'translate-x-1',
									]"
								/>
							</button>
							<span class="text-sm text-minimal-muted">
								{{
									flagState.isEnabled
										? 'Flag will be enabled by default'
										: 'Flag will be disabled by default'
								}}
							</span>
						</div>
					</div>
				</section>

				<!-- Advanced Targeting Rules (New Flag Pre-Creation) -->
				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-minimal-primary">Advanced Targeting Rules (Opcjonalne)</h3>
						<div class="flex gap-2">
							<button
								type="button"
								class="btn-minimal-ghost flex items-center gap-2 text-sm"
								@click="openAddRule('GROUP')"
							>
								<UIcon name="i-heroicons-user-group" class="w-4 h-4" /> Group Rule
							</button>
							<button
								type="button"
								class="btn-minimal-ghost flex items-center gap-2 text-sm"
								@click="openAddRule('ATTRIBUTE')"
							>
								<UIcon name="i-heroicons-adjustments-vertical" class="w-4 h-4" /> Attribute Rule
							</button>
						</div>
					</div>

					<div v-if="advanced.rules.length === 0" class="text-sm text-minimal-muted">
						Brak zaawansowanych reguł.
					</div>
					<div v-else class="space-y-3">
						<table class="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
							<thead class="bg-gray-50 text-left">
								<tr>
									<th class="px-3 py-2 font-medium text-gray-700">Type</th>
									<th class="px-3 py-2 font-medium text-gray-700">Definition</th>
									<th class="px-3 py-2"></th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="(rule, idx) in advanced.rules" :key="idx" class="border-t">
									<td class="px-3 py-2">
										<span
											v-if="rule.targetingType === 'GROUP'"
											class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"
											>GROUP</span
										>
										<span
											v-else
											class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
											>ATTRIBUTE</span
										>
									</td>
									<td class="px-3 py-2 font-mono text-xs">
										<template v-if="rule.targetingType === 'GROUP'"
											>Group == {{ rule.groupId }}</template
										>
										<template v-else
											>{{ rule.attribute }} {{ rule.operator }}
											{{ formatValue(rule.value) }}</template
										>
									</td>
									<td class="px-3 py-2 text-right">
										<button
											class="text-red-600 hover:text-red-700 text-xs"
											@click="removeAdvancedRule(idx)"
										>
											Delete
										</button>
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					<!-- Add Rule Modal -->
					<UModal v-model="modal.open">
						<div class="p-5 space-y-5">
							<h4 class="text-base font-medium text-minimal-primary">Add {{ modal.type }} Rule</h4>
							<div v-if="modal.type === 'GROUP'" class="space-y-3">
								<label class="block text-sm font-medium">Group ID</label>
								<UInput v-model="form.groupId" placeholder="e.g. beta-testers" />
							</div>
							<div v-else class="space-y-3">
								<div class="grid grid-cols-3 gap-3">
									<div class="col-span-1 space-y-1">
										<label class="block text-sm font-medium">Attribute</label>
										<UInput v-model="form.attribute" placeholder="country" />
									</div>
									<div class="col-span-1 space-y-1">
										<label class="block text-sm font-medium">Operator</label>
										<USelect v-model="form.operator" :options="operators" />
									</div>
									<div class="col-span-1 space-y-1">
										<label class="text-sm font-medium flex items-center justify-between">
											<span>Value</span>
											<button
												type="button"
												class="text-xs text-blue-600"
												@click="toggleValueMode"
												v-if="isArrayOperator(form.operator)"
											>
												{{ form.valueIsArray ? 'Single' : 'List' }}
											</button>
										</label>
										<div v-if="form.valueIsArray" class="space-y-2">
											<div class="flex flex-wrap gap-2">
												<span
													v-for="(chip, i) in form.valueList"
													:key="i"
													class="px-2 py-0.5 rounded bg-gray-100 text-xs flex items-center gap-1"
												>
													{{ chip }}
													<button
														class="text-gray-500 hover:text-gray-700"
														@click="removeValueChip(i)"
													>
														×
													</button>
												</span>
											</div>
											<div class="flex gap-2">
												<UInput
													v-model="tempValue"
													placeholder="Add value"
													@keyup.enter.prevent="addValueChip"
												/>
												<button
													type="button"
													class="btn-minimal-ghost text-xs"
													@click="addValueChip"
												>
													Add
												</button>
											</div>
										</div>
										<div v-else>
											<UInput v-model="form.value" placeholder="e.g. PL" />
										</div>
									</div>
								</div>
								<p class="text-xs text-red-600" v-if="modal.error">{{ modal.error }}</p>
							</div>
							<div class="flex justify-end gap-2 pt-2">
								<button
									type="button"
									class="btn-minimal-ghost text-sm"
									@click="closeModal"
									:disabled="modal.saving"
								>
									Cancel
								</button>
								<button
									type="button"
									class="btn-minimal text-sm flex items-center gap-2"
									@click="submitRuleLocal"
									:disabled="modal.saving"
								>
									<UIcon
										v-if="modal.saving"
										name="i-heroicons-arrow-path"
										class="w-4 h-4 animate-spin"
									/>
									<span>{{ modal.saving ? 'Saving...' : 'Add Rule' }}</span>
								</button>
							</div>
						</div>
					</UModal>
				</section>

				<div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
					<button type="button" class="btn-minimal-ghost" @click="navigateTo('/flags')" :disabled="creating">
						Cancel
					</button>
					<button type="submit" class="btn-minimal flex items-center gap-2" :disabled="creating">
						<UIcon v-if="creating" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
						{{ creating ? 'Creating...' : 'Create Flag' }}
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

const { flags } = useApi()
const toast = useToast()

const creating = ref(false)
const showRules = ref(false)

const flagState = reactive({
	name: '',
	key: '',
	description: '',
	type: 'BOOLEAN',
	isEnabled: false,
	rolloutPercentage: undefined as number | undefined,
	configJsonText: '',
	rules: [] as Array<{ condition: string; value: boolean }>,
})

// Advanced rules local (before flag exists)
const advanced = reactive({
	rules: [] as any[],
})
const modal = reactive({ open: false, type: 'GROUP' as 'GROUP' | 'ATTRIBUTE', saving: false, error: '' })
const form = reactive<any>({
	groupId: '',
	attribute: '',
	operator: 'EQUALS',
	value: '',
	valueIsArray: false,
	valueList: [] as string[],
})
const tempValue = ref('')
const operators = ['EQUALS', 'IN', 'NOT_IN', 'GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL']

function openAddRule(type: 'GROUP' | 'ATTRIBUTE') {
	modal.type = type
	modal.open = true
	modal.error = ''
	Object.assign(form, {
		groupId: '',
		attribute: '',
		operator: 'EQUALS',
		value: '',
		valueIsArray: false,
		valueList: [],
	})
}
function closeModal() {
	modal.open = false
}
function isArrayOperator(op: string) {
	return op === 'IN' || op === 'NOT_IN'
}
function toggleValueMode() {
	form.valueIsArray = !form.valueIsArray
	if (!form.valueIsArray) form.valueList = []
}
function addValueChip() {
	if (tempValue.value.trim()) {
		form.valueList.push(tempValue.value.trim())
		tempValue.value = ''
	}
}
function removeValueChip(i: number) {
	form.valueList.splice(i, 1)
}
function formatValue(v: any) {
	return Array.isArray(v) ? '[' + v.join(', ') + ']' : JSON.stringify(v)
}
function validateModal(): boolean {
	if (modal.type === 'GROUP') {
		if (!form.groupId.trim()) {
			modal.error = 'groupId is required'
			return false
		}
		return true
	}
	if (!form.attribute.trim()) {
		modal.error = 'attribute required'
		return false
	}
	if (!form.operator) {
		modal.error = 'operator required'
		return false
	}
	if (isArrayOperator(form.operator)) {
		if (!form.valueIsArray || form.valueList.length === 0) {
			modal.error = 'Provide at least one value'
			return false
		}
	} else {
		if (form.value === '') {
			modal.error = 'value required'
			return false
		}
		if (
			['GREATER_THAN', 'LESS_THAN', 'GREATER_OR_EQUAL', 'LESS_OR_EQUAL'].includes(form.operator) &&
			isNaN(Number(form.value))
		) {
			modal.error = 'Numeric operator requires numeric value'
			return false
		}
	}
	return true
}
function submitRuleLocal() {
	if (!validateModal()) return
	modal.saving = true
	try {
		const payload: any = { targetingType: modal.type }
		if (modal.type === 'GROUP') payload.groupId = form.groupId.trim()
		else {
			payload.attribute = form.attribute.trim()
			payload.operator = form.operator
			payload.value = isArrayOperator(form.operator) ? form.valueList.slice() : form.value
		}
		advanced.rules.push(payload)
		closeModal()
	} finally {
		modal.saving = false
	}
}
function removeAdvancedRule(idx: number) {
	advanced.rules.splice(idx, 1)
}

function generateKey() {
	if (flagState.name && !flagState.key) {
		const kebabCase = flagState.name
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '')
		flagState.key = `feature.${kebabCase}`
	}
}

function addRule() {
	flagState.rules.push({ condition: '', value: true })
}
function removeRule(index: number) {
	flagState.rules.splice(index, 1)
	if (flagState.rules.length === 0) showRules.value = false
}

async function createFlag() {
	creating.value = true
	try {
		const payload = {
			key: flagState.key.trim(),
			description: flagState.description?.trim() || undefined,
			type: flagState.type,
			isEnabled: flagState.isEnabled,
			...(flagState.type === 'PERCENTAGE' ? { rolloutPercentage: flagState.rolloutPercentage || 0 } : {}),
			...(flagState.type === 'CONFIG' ? { configJson: JSON.parse(flagState.configJsonText || '{}') } : {}),
			rules: showRules.value && flagState.rules.length > 0 ? flagState.rules : undefined,
		}

		const created = await flags.create(payload)

		// After creation, if advanced rules exist, create them sequentially
		if (created?.success && advanced.rules.length > 0) {
			const createdId = (created.data as any).id || (created.data as any).key
			for (const r of advanced.rules) {
				try {
					await flags.createAdvancedRule(createdId, r)
				} catch (e: any) {
					console.error('Failed to create advanced rule', e)
				}
			}
		}

		toast.add({
			title: 'Success',
			description: `Feature flag "${payload.key}" has been created successfully.`,
			color: 'green',
		})
		navigateTo('/flags')
	} catch (error: any) {
		console.error('Error creating flag:', error)
		toast.add({
			title: 'Error',
			description: error.message || 'Failed to create feature flag. Please try again.',
			color: 'red',
		})
	} finally {
		creating.value = false
	}
}

useHead({ title: 'Create New Feature Flag' })
</script>
