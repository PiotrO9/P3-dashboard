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

				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-minimal-primary">Rules (Optional)</h3>
						<button
							v-if="!showRules"
							type="button"
							class="btn-minimal-ghost flex items-center gap-2 text-sm"
							@click="showRules = true"
						>
							<UIcon name="i-heroicons-plus" class="w-4 h-4" />
							Add Rules
						</button>
					</div>

					<div v-if="showRules" class="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
						<div class="flex items-center justify-between">
							<p class="text-sm text-minimal-secondary">
								Add conditional rules to control when this flag should be enabled or disabled.
							</p>
							<button
								type="button"
								class="btn-minimal-ghost flex items-center gap-2 text-sm"
								@click="showRules = false"
							>
								<UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
								Hide Rules
							</button>
						</div>

						<div
							v-for="(rule, index) in flagState.rules"
							:key="index"
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
								<label class="text-sm font-medium text-minimal-primary"
									>Condition {{ index + 1 }}</label
								>
								<input
									v-model="rule.condition"
									type="text"
									placeholder="e.g., user.role == 'admin'"
									class="input-minimal w-full"
								/>
							</div>

							<div class="space-y-2">
								<label class="text-sm font-medium text-minimal-primary">Value {{ index + 1 }}</label>
								<button
									type="button"
									@click="rule.value = !rule.value"
									:class="[
										'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
										rule.value
											? 'bg-blue-600 focus:ring-blue-500'
											: 'bg-gray-300 focus:ring-gray-400',
									]"
								>
									<span
										:class="[
											'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
											rule.value ? 'translate-x-6' : 'translate-x-1',
										]"
									/>
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

						<button
							type="button"
							class="btn-minimal-ghost flex items-center gap-2 text-sm"
							@click="addRule"
						>
							<UIcon name="i-heroicons-plus" class="w-4 h-4" />
							Add Another Rule
						</button>
					</div>
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
import { navigateTo } from 'nuxt/app'

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

const generateKey = () => {
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

const addRule = () => {
	flagState.rules.push({ condition: '', value: true })
}
const removeRule = (index: number) => {
	flagState.rules.splice(index, 1)
	if (flagState.rules.length === 0) showRules.value = false
}

const createFlag = async () => {
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

		await flags.create(payload)

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
