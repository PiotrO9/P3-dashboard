<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold text-minimal-primary">Evaluate Feature Flag</h1>
			<p class="mt-1 text-minimal-secondary">Test your feature flags with different contexts and conditions.</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="minimal-card">
				<h3 class="text-lg font-medium text-minimal-primary mb-4">Evaluation Input</h3>

				<UForm :schema="evaluationSchema" :state="evaluationState" class="space-y-4" @submit="evaluateFlag">
					<UFormGroup label="Flag Key" name="flagKey" required>
						<UInput v-model="evaluationState.flagKey" placeholder="e.g., feature.new-ui" />
					</UFormGroup>

					<UFormGroup label="Context (JSON)" name="context">
						<UTextarea
							v-model="contextString"
							placeholder='{"user": {"id": 123, "role": "admin"}, "plan": "premium"}'
							rows="8"
						/>
					</UFormGroup>

					<UButton type="submit" :loading="evaluating" :disabled="evaluating" block>
						{{ evaluating ? 'Evaluating...' : 'Evaluate Flag' }}
					</UButton>
				</UForm>
			</div>

			<UCard>
				<template #header>
					<h3 class="text-lg font-medium">Evaluation Result</h3>
				</template>

				<div v-if="!hasEvaluated" class="text-center py-12 text-gray-500">
					<UIcon name="i-heroicons-calculator" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
					<p>Enter a flag key and click "Evaluate Flag" to see the result</p>
				</div>

				<div v-else class="space-y-4">
					<div class="text-center">
						<UBadge
							:color="lastResult?.result ? 'green' : 'red'"
							variant="soft"
							size="lg"
							class="text-lg px-4 py-2"
						>
							<UIcon
								:name="lastResult?.result ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
								class="w-5 h-5 mr-2"
							/>
							{{ lastResult?.result ? 'TRUE' : 'FALSE' }}
						</UBadge>
					</div>

					<div class="space-y-3">
						<div>
							<label class="text-sm font-medium text-gray-700">Flag Key</label>
							<p class="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
								{{ lastEvaluation.flagKey }}
							</p>
						</div>

						<div v-if="lastEvaluation.context && Object.keys(lastEvaluation.context).length > 0">
							<label class="text-sm font-medium text-gray-700">Context Used</label>
							<pre class="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-auto">{{
								JSON.stringify(lastEvaluation.context, null, 2)
							}}</pre>
						</div>

						<div>
							<label class="text-sm font-medium text-gray-700">Evaluated At</label>
							<p class="mt-1 text-sm text-gray-900">
								{{ new Date().toLocaleString() }}
							</p>
						</div>
					</div>

					<UAlert
						icon="i-heroicons-information-circle"
						color="blue"
						variant="soft"
						title="Evaluation Details"
						description="In a real implementation, this would show which rules matched and the evaluation path."
					/>
				</div>
			</UCard>
		</div>

		<UCard v-if="evaluationHistory.length > 0">
			<template #header>
				<h3 class="text-lg font-medium">Recent Evaluations</h3>
			</template>

			<UTable :rows="evaluationHistory" :columns="historyColumns">
				<template #result-data="{ row }">
					<UBadge :color="row.result ? 'green' : 'red'" variant="soft">
						{{ row.result ? 'TRUE' : 'FALSE' }}
					</UBadge>
				</template>

				<template #timestamp-data="{ row }">
					<span class="text-sm text-gray-500">
						{{ new Date(row.timestamp).toLocaleString() }}
					</span>
				</template>

				<template #actions-data="{ row }">
					<UButton color="blue" variant="ghost" size="xs" @click="rerunEvaluation(row)"> Re-run </UButton>
				</template>
			</UTable>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { EvaluateRequest } from '~/types'

definePageMeta({
	middleware: 'auth',
})

const { flags } = useApi()
const toast = useToast()

const evaluationSchema = z.object({
	flagKey: z.string().min(1, 'Flag key is required'),
})

const evaluationState = reactive({
	flagKey: '',
})

const contextString = ref('{}')
const evaluating = ref(false)
const hasEvaluated = ref(false)
const lastResult = ref<{ result: boolean } | null>(null)
const lastEvaluation = ref<EvaluateRequest>({ flagKey: '' })

interface EvaluationHistoryItem {
	flagKey: string
	context?: Record<string, any>
	result: boolean
	timestamp: string
}

const evaluationHistory = ref<EvaluationHistoryItem[]>([])

const historyColumns = [
	{
		key: 'flagKey',
		label: 'Flag Key',
	},
	{
		key: 'result',
		label: 'Result',
	},
	{
		key: 'timestamp',
		label: 'Time',
	},
	{
		key: 'actions',
		label: 'Actions',
	},
]

const evaluateFlag = async () => {
	try {
		evaluating.value = true

		let context: Record<string, any> = {}
		if (contextString.value.trim()) {
			try {
				context = JSON.parse(contextString.value)
			} catch (error) {
				throw new Error('Invalid JSON in context field')
			}
		}

		const request: EvaluateRequest = {
			flagKey: evaluationState.flagKey,
			context: Object.keys(context).length > 0 ? context : undefined,
		}

		const response = await flags.evaluate(request)

		if (response.success) {
			lastResult.value = response.data
			lastEvaluation.value = request
			hasEvaluated.value = true

			evaluationHistory.value.unshift({
				flagKey: request.flagKey,
				context: request.context,
				result: response.data.result,
				timestamp: new Date().toISOString(),
			})

			if (evaluationHistory.value.length > 10) {
				evaluationHistory.value = evaluationHistory.value.slice(0, 10)
			}

			toast.add({
				title: 'Flag evaluated successfully',
				description: `Result: ${response.data.result ? 'TRUE' : 'FALSE'}`,
				color: response.data.result ? 'green' : 'orange',
			})
		}
	} catch (error: any) {
		toast.add({
			title: 'Evaluation failed',
			description: error.message,
			color: 'red',
		})
	} finally {
		evaluating.value = false
	}
}

const rerunEvaluation = (item: EvaluationHistoryItem) => {
	evaluationState.flagKey = item.flagKey
	contextString.value = item.context ? JSON.stringify(item.context, null, 2) : '{}'
}

onMounted(() => {
	evaluationState.flagKey = 'feature.new-dashboard'
	contextString.value = JSON.stringify(
		{
			user: {
				id: 123,
				role: 'admin',
				plan: 'premium',
			},
			environment: 'production',
		},
		null,
		2
	)
})
</script>
