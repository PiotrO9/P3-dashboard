<template>
	<div class="max-w-5xl mx-auto space-y-8 p-6" v-if="!loading && flagLoaded">
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
						<h3 class="text-lg font-medium text-minimal-primary">Advanced Targeting Rules</h3>
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

					<div v-if="advanced.loading" class="text-sm text-minimal-muted flex items-center gap-2">
						<UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" /> Loading rules...
					</div>
					<div v-else-if="advanced.rules.length === 0" class="text-sm text-minimal-muted">
						No advanced rules yet.
					</div>
					<div v-else class="space-y-3">
						<table class="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
							<thead class="bg-gray-50 text-left">
								<tr>
									<th class="px-3 py-2 font-medium text-gray-700">Type</th>
									<th class="px-3 py-2 font-medium text-gray-700">Definition</th>
									<th class="px-3 py-2 font-medium text-gray-700 w-32">Created</th>
									<th class="px-3 py-2"></th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="rule in advanced.rules" :key="rule.id" class="border-t">
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
										<template v-if="rule.targetingType === 'GROUP'">
											Group == {{ rule.groupId }}
										</template>
										<template v-else>
											{{ rule.attribute }} {{ rule.operator }} {{ formatValue(rule.value) }}
										</template>
									</td>
									<td class="px-3 py-2 text-xs text-gray-500">{{ timeAgo(rule.createdAt) }}</td>
									<td class="px-3 py-2 text-right">
										<button
											class="text-red-600 hover:text-red-700 text-xs"
											@click="deleteRule(rule.id)"
											:disabled="advanced.deleting[rule.id]"
										>
											<span
												v-if="advanced.deleting[rule.id]"
												class="inline-flex items-center gap-1"
												><UIcon
													name="i-heroicons-arrow-path"
													class="w-3 h-3 animate-spin"
												/>Deleting</span
											>
											<span v-else>Delete</span>
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
										<label class="block text-sm font-medium flex items-center justify-between">
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
									@click="submitRule"
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
	{ name: '', key: '', description: '', enabled: false, rules: [] }
)

// Advanced rules state
const advanced = reactive({
	rules: [] as any[],
	loading: false,
	deleting: {} as Record<string, boolean>,
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
function timeAgo(dateStr: string) {
	try {
		const d = new Date(dateStr)
		const diff = Date.now() - d.getTime()
		const m = Math.floor(diff / 60000)
		if (m < 60) return m + 'm'
		const h = Math.floor(m / 60)
		if (h < 24) return h + 'h'
		const days = Math.floor(h / 24)
		return days + 'd'
	} catch {
		return ''
	}
}

async function loadAdvancedRules() {
	advanced.loading = true
	try {
		const res = await flags.getAdvancedRules(id.value)
		if (res.success) advanced.rules = res.rules
	} catch (e: any) {
		toast.add({ title: 'Load rules failed', description: e.message, color: 'red' })
	} finally {
		advanced.loading = false
	}
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

async function submitRule() {
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
		const res = await flags.createAdvancedRule(id.value, payload)
		if (res.success) {
			advanced.rules.push(res.rule)
			toast.add({ title: 'Rule added', color: 'green' })
			closeModal()
		}
	} catch (e: any) {
		modal.error = e?.data?.message || e.message || 'Failed to add rule'
	} finally {
		modal.saving = false
	}
}

async function deleteRule(ruleId: string) {
	advanced.deleting[ruleId] = true
	try {
		const res = await flags.deleteAdvancedRule(ruleId)
		if (res.success) {
			advanced.rules = advanced.rules.filter(r => r.id !== ruleId)
			toast.add({ title: 'Rule deleted', color: 'green' })
		}
	} catch (e: any) {
		toast.add({ title: 'Delete failed', description: e.message, color: 'red' })
	} finally {
		advanced.deleting[ruleId] = false
	}
}

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

onMounted(async () => {
	await loadFlag()
	await loadAdvancedRules()
})
</script>
