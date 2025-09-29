<template>
	<div
		class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8"
	>
		<div class="max-w-md w-full space-y-8">
			<div>
				<div class="flex justify-center">
					<div class="icon-gradient p-4 rounded-2xl shadow-xl size-20">
						<UIcon name="i-heroicons-cog-6-tooth" class="w-12 h-12 text-white" />
					</div>
				</div>
				<h2 class="mt-6 text-center text-3xl font-extrabold text-slate-800 dark:text-slate-100">
					Sign in to Admin Panel
				</h2>
				<p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-300 font-semibold">
					Feature flag management system
				</p>
			</div>

			<UCard
				class="glass-card dark:glass-card-dark p-8 shadow-2xl border-0 ring-1 ring-slate-200/60 dark:ring-slate-700/60"
			>
				<UForm ref="form" :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
					<UFormGroup label="Email" name="email" required class="space-y-2">
						<template #label>
							<span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Email *</span>
						</template>
						<UInput
							v-model="state.email"
							type="email"
							placeholder="Enter your email"
							icon="i-heroicons-envelope"
							size="lg"
							color="primary"
							variant="outline"
							class="high-contrast-input high-contrast-placeholder focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200"
						/>
					</UFormGroup>

					<UFormGroup label="Password" name="password" required class="space-y-2">
						<template #label>
							<span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Password *</span>
						</template>
						<UInput
							v-model="state.password"
							type="password"
							placeholder="Enter your password"
							icon="i-heroicons-lock-closed"
							size="lg"
							color="primary"
							variant="outline"
							class="high-contrast-input high-contrast-placeholder focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200"
						/>
					</UFormGroup>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<UCheckbox
								v-model="state.remember"
								label="Remember me"
								class="text-sm font-medium text-slate-700 dark:text-slate-200"
							/>
						</div>

						<ULink
							class="text-sm text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors duration-200 underline decoration-2 underline-offset-2"
						>
							Forgot your password?
						</ULink>
					</div>

					<UButton
						type="submit"
						block
						:loading="loading"
						:disabled="loading"
						size="lg"
						color="primary"
						class="btn-gradient dark:btn-gradient-dark text-white font-semibold text-base py-3 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
					>
						{{ loading ? 'Signing in...' : 'Sign in' }}
					</UButton>

					<UAlert
						v-if="error"
						color="red"
						variant="soft"
						:title="error"
						:close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link' }"
						@close="error = null"
					/>
				</UForm>

				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-slate-300 dark:border-slate-600" />
						</div>
						<div class="relative flex justify-center text-sm">
							<span
								class="px-4 bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-300 font-semibold backdrop-blur-sm"
								>Don't have an account?</span
							>
						</div>
					</div>
					<div class="mt-6 text-center">
						<p class="text-sm font-medium text-slate-600 dark:text-slate-300">
							Contact your administrator to get access
						</p>
					</div>
				</div>
			</UCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import { z } from 'zod'

// Disable default layout for login page
definePageMeta({
	layout: false,
})

const { login } = useAuth()
const router = useRouter()

// Form state and validation
const schema = z.object({
	email: z.string().email('Invalid email'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
})

type Schema = z.output<typeof schema>

const state = reactive({
	email: '',
	password: '',
	remember: false,
})

const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
	loading.value = true
	error.value = null

	try {
		const response = await login({
			email: event.data.email,
			password: event.data.password,
		})

		if (response.success) {
			// TODO: Show success message
			await router.push('/dashboard')
		}
	} catch (err: any) {
		error.value = err.message || 'Login failed. Please try again.'
		console.error('Login error:', err)
	} finally {
		loading.value = false
	}
}

// Redirect if already authenticated
const { isAuthenticated } = useAuth()
onMounted(() => {
	if (isAuthenticated.value) {
		router.push('/dashboard')
	}
})
</script>
