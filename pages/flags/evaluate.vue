<template>
	<div class="space-y-6">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-minimal-primary">Evaluate Feature Flag</h1>
				<p class="mt-1 text-minimal-secondary max-w-2xl">
					Interactively test how a flag resolves for a given user context (groups, attributes, rollout).
				</p>
			</div>
			<UButton icon="i-heroicons-arrow-path" variant="ghost" :disabled="evaluating" @click="resetForm"
				>Reset</UButton
			>
		</div>

		<div class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
			<!-- Input -->
			<UCard class="xl:col-span-1">
				<template #header>
					<div class="flex items-center gap-2">
						<UIcon name="i-heroicons-adjustments-horizontal" class="w-5 h-5 text-gray-500" />
						<h3 class="text-lg font-medium">Evaluation Input</h3>
					</div>
				</template>
				<UForm :schema="evaluationSchema" :state="evaluationState" class="space-y-5" @submit="evaluateFlag">
					<UFormGroup label="Flag" name="flagKey" required>
						<div class="flex gap-2">
							<USelect
								v-model="evaluationState.flagKey"
								:options="flagOptions"
								placeholder="Select a flag or type key"
								searchable
								clearable
								class="flex-1"
							/>
							<UTooltip text="Refresh flags">
								<UButton
									icon="i-heroicons-arrow-path"
									color="gray"
									variant="soft"
									@click="loadFlags"
									:loading="loadingFlags"
								/>
							</UTooltip>
						</div>
					</UFormGroup>

					<UFormGroup label="User Id" name="userId">
						<UInput v-model="userId" placeholder="Optional user id (for percentage rollouts)" />
					</UFormGroup>

					<UAccordion :items="[attrSection]" multiple>
						<template #item-content-attributes>
							<div class="space-y-2">
								<UTextarea
									v-model="attributesJson"
									rows="8"
									spellcheck="false"
									class="font-mono text-sm"
									placeholder='{"country":"PL","role":"ADMIN","age":30}'
								/>
								<div class="flex justify-between text-xs text-gray-500">
									<span>User attributes JSON (optional)</span>
									<UButton size="2xs" variant="link" color="gray" @click="formatAttributes"
										>Format</UButton
									>
								</div>
							</div>
						</template>
					</UAccordion>

					<div class="pt-2">
						<UButton
							type="submit"
							:loading="evaluating"
							:disabled="!evaluationState.flagKey || evaluating"
							block
						>
							{{ evaluating ? 'Evaluating...' : 'Evaluate Flag' }}
						</UButton>
					</div>
				</UForm>
			</UCard>

			<!-- Result -->
			<UCard class="xl:col-span-1">
				<template #header>
					<div class="flex items-center gap-2">
						<UIcon name="i-heroicons-beaker" class="w-5 h-5 text-gray-500" />
						<h3 class="text-lg font-medium">Evaluation Result</h3>
					</div>
				</template>
				<div v-if="!hasEvaluated" class="text-center py-12 text-gray-500">
					<UIcon name="i-heroicons-calculator" class="w-12 h-12 mx-auto mb-4 text-gray-400" />
					<p>Select or enter a flag key and click Evaluate Flag</p>
				</div>
				<div v-else class="space-y-6">
					<div class="flex flex-col items-center gap-3">
						<UBadge
							:color="lastResult?.value ? 'green' : 'red'"
							variant="soft"
							size="lg"
							class="text-lg px-4 py-2"
						>
							<UIcon
								:name="lastResult?.value ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
								class="w-5 h-5 mr-2"
							/>
							{{ lastResult?.value ? 'TRUE' : 'FALSE' }}
						</UBadge>
						<div class="flex gap-2 text-xs text-gray-500">
							<span
								>matched:
								<strong :class="lastResult?.matched ? 'text-green-600' : 'text-red-600'">{{
									lastResult?.matched
								}}</strong></span
							>
							<span v-if="typeof lastResult?.value !== 'boolean'"
								>value type: {{ typeof lastResult?.value }}</span
							>
						</div>
					</div>
					<div class="space-y-3">
						<div>
							<label class="text-sm font-medium text-gray-700">Flag Key</label>
							<p class="mt-1 text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
								{{ evaluationState.flagKey }}
							</p>
						</div>
						<div
							v-if="
								usedContext &&
								(usedContext.groups?.length || Object.keys(usedContext.attributes || {}).length)
							"
						>
							<label class="text-sm font-medium text-gray-700">Context</label>
							<pre class="mt-1 text-xs text-gray-900 bg-gray-50 p-3 rounded max-h-64 overflow-auto">{{
								JSON.stringify(usedContext, null, 2)
							}}</pre>
						</div>
						<div>
							<label class="text-sm font-medium text-gray-700">Evaluated At</label>
							<p class="mt-1 text-sm text-gray-900">{{ new Date(lastTimestamp).toLocaleString() }}</p>
						</div>
					</div>
					<UAccordion :items="[rawSection]" multiple>
						<template #item-content-raw>
							<pre class="text-xs bg-gray-50 p-3 rounded max-h-72 overflow-auto font-mono">{{
								rawJson
							}}</pre>
						</template>
					</UAccordion>
					<UAlert
						icon="i-heroicons-information-circle"
						color="blue"
						variant="soft"
						title="How this works"
						:description="'Rules are checked in-memory. If none match, matched=false. For percentage flags userId hashing is applied.'"
					/>
				</div>
			</UCard>

			<!-- History -->
			<UCard v-if="evaluationHistory.length" class="xl:col-span-2">
				<template #header>
					<div class="flex items-center gap-2">
						<UIcon name="i-heroicons-clock" class="w-5 h-5 text-gray-500" />
						<h3 class="text-lg font-medium">Recent Evaluations</h3>
					</div>
				</template>
				<UTable :rows="evaluationHistory" :columns="historyColumns">
					<template #value-data="{ row }">
						<UBadge :color="row.value ? 'green' : 'red'" variant="soft">{{
							row.value ? 'TRUE' : 'FALSE'
						}}</UBadge>
					</template>
					<template #matched-data="{ row }">
						<UBadge :color="row.matched ? 'green' : 'gray'" variant="subtle">{{
							row.matched ? 'yes' : 'no'
						}}</UBadge>
					</template>
					<template #timestamp-data="{ row }">
						<span class="text-xs text-gray-500">{{ new Date(row.timestamp).toLocaleTimeString() }}</span>
					</template>
					<template #actions-data="{ row }">
						<div class="flex gap-1">
							<UTooltip text="Re-run">
								<UButton
									icon="i-heroicons-arrow-uturn-left"
									size="2xs"
									color="gray"
									variant="ghost"
									@click="rerunEvaluation(row)"
								/>
							</UTooltip>
							<UTooltip text="Load context">
								<UButton
									icon="i-heroicons-clipboard"
									size="2xs"
									color="gray"
									variant="ghost"
									@click="loadContext(row)"
								/>
							</UTooltip>
						</div>
					</template>
				</UTable>
				<div class="mt-3 flex justify-end">
					<UButton size="xs" variant="link" color="gray" @click="clearHistory">Clear history</UButton>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { z } from 'zod'
// @ts-ignore
import { definePageMeta, useApi, useToast } from '#imports'
import type { FeatureFlag, FlagEvaluationRequest } from '../../types'

definePageMeta({
	middleware: 'auth',
})

const { flags } = useApi()
const toast = useToast()
const flagOptions = ref<{ label: string; value: string }[]>([])
const loadingFlags = ref(false)

async function loadFlags() {
	try {
		loadingFlags.value = true
		const res = await flags.getAll()
		if (res.success) {
			flagOptions.value = res.data.map((f: FeatureFlag) => ({ label: f.key, value: f.key }))
		}
	} catch (e) {
	} finally {
		loadingFlags.value = false
	}
}

onMounted(() => loadFlags())

const evaluationSchema = z.object({
	flagKey: z.string().min(1, 'Flag key is required'),
})

const evaluationState = reactive({ flagKey: '' })
const userId = ref('')
const attributesJson = ref('{\n  "country": "PL"\n}')
const attrSection = reactive({ id: 'attributes', label: 'Attributes (JSON)', icon: 'i-heroicons-code-bracket-square' })
const rawSection = reactive({ id: 'raw', label: 'Raw Response', icon: 'i-heroicons-document-text' })
const evaluating = ref(false)
const hasEvaluated = ref(false)
const lastResult = ref<{ matched?: boolean; value: any } | null>(null)
const usedContext = ref<any | null>(null)
const rawJson = ref('')
const lastTimestamp = ref<string>('')

interface EvaluationHistoryItem {
	flagKey: string
	matched?: boolean
	value: any
	request: FlagEvaluationRequest
	timestamp: string
}

const evaluationHistory = ref<EvaluationHistoryItem[]>([])

const historyColumns = [
	{
		key: 'flagKey',
		label: 'Flag Key',
	},
	{
		key: 'value',
		label: 'Value',
	},
	{ key: 'matched', label: 'Matched' },
	{
		key: 'timestamp',
		label: 'Time',
	},
	{
		key: 'actions',
		label: 'Actions',
	},
]

function parseAttributes(): Record<string, any> | undefined {
	if (!attributesJson.value.trim()) return undefined
	try {
		return JSON.parse(attributesJson.value)
	} catch {
		throw new Error('Attributes JSON is invalid')
	}
}

function formatAttributes() {
	try {
		const parsed = parseAttributes()
		if (parsed) attributesJson.value = JSON.stringify(parsed, null, 2)
	} catch {}
}

function buildRequest(): FlagEvaluationRequest {
	const attrs = parseAttributes()
	const req: FlagEvaluationRequest = { flagKey: evaluationState.flagKey }
	if (userId.value.trim()) req.userId = userId.value.trim()
	if (attrs && Object.keys(attrs).length) req.userAttributes = attrs
	return req
}

async function evaluateFlag() {
	try {
		evaluating.value = true
		const request = buildRequest()
		const response = await flags.evaluate(request)
		if (response.success) {
			const matched = (response as any).matched ?? (response as any).result?.matched
			const value = (response as any).value ?? (response as any).result?.value
			lastResult.value = { matched, value }
			usedContext.value = request.userAttributes
				? { userId: request.userId, attributes: request.userAttributes }
				: null
			lastTimestamp.value = new Date().toISOString()
			rawJson.value = JSON.stringify(response, null, 2)
			hasEvaluated.value = true
			evaluationHistory.value.unshift({
				flagKey: evaluationState.flagKey,
				matched,
				value,
				request,
				timestamp: lastTimestamp.value,
			})
			if (evaluationHistory.value.length > 15) evaluationHistory.value = evaluationHistory.value.slice(0, 15)
			toast.add({
				title: 'Evaluation complete',
				description: `Result: ${String(value)}`,
				color: value ? 'green' : 'orange',
			})
		}
	} catch (error: any) {
		toast.add({ title: 'Evaluation failed', description: error.message, color: 'red' })
	} finally {
		evaluating.value = false
	}
}

function rerunEvaluation(item: EvaluationHistoryItem) {
	evaluationState.flagKey = item.flagKey
	userId.value = item.request.userId || ''
	attributesJson.value = item.request.userAttributes ? JSON.stringify(item.request.userAttributes, null, 2) : ''
	evaluateFlag()
}

function loadContext(item: EvaluationHistoryItem) {
	userId.value = item.request.userId || ''
	attributesJson.value = item.request.userAttributes ? JSON.stringify(item.request.userAttributes, null, 2) : ''
}

function clearHistory() {
	evaluationHistory.value = []
}

function resetForm() {
	evaluationState.flagKey = ''
	userId.value = ''
	attributesJson.value = ''
	lastResult.value = null
	usedContext.value = null
	hasEvaluated.value = false
	rawJson.value = ''
}

onMounted(() => {
	if (!evaluationState.flagKey) evaluationState.flagKey = 'feature.new-dashboard'
	attributesJson.value = '{\n  "country": "PL",\n  "role": "ADMIN",\n  "age": 31\n}'
})
</script>
