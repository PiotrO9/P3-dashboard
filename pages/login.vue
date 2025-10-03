<template>
	<div class="login-minimal flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
		<div class="max-w-md w-full space-y-8">
			<div class="text-center">
				<div class="flex justify-center mb-6">
					<div class="icon-minimal">
						<UIcon name="i-heroicons-cog-6-tooth" class="w-6 h-6" />
					</div>
				</div>
				<h2 class="text-3xl font-semibold text-minimal-primary">Sign in to Admin Panel</h2>
				<p class="mt-2 text-minimal-secondary">Feature flag management system</p>
			</div>

			<div class="login-card">
				<UForm ref="form" :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Email *</label>
						<div class="relative">
							<UIcon
								name="i-heroicons-envelope"
								class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-minimal-muted"
							/>
							<input
								v-model="state.email"
								type="email"
								placeholder="Enter your email"
								class="input-minimal w-full pl-10"
								required
							/>
						</div>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Password *</label>
						<div class="relative">
							<UIcon
								name="i-heroicons-lock-closed"
								class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-minimal-muted"
							/>
							<input
								v-model="state.password"
								type="password"
								placeholder="Enter your password"
								class="input-minimal w-full pl-10"
								required
							/>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<label class="flex items-center">
							<input v-model="state.remember" type="checkbox" class="rounded border-gray-300 mr-2" />
							<span class="text-sm text-minimal-secondary">Remember me</span>
						</label>

						<a href="#" class="text-sm" style="color: var(--accent-primary)"> Forgot your password? </a>
					</div>

					<button type="submit" :disabled="loading" class="btn-minimal w-full py-3 text-base font-medium">
						{{ loading ? 'Signing in...' : 'Sign in' }}
					</button>

					<div v-if="error" class="badge-error p-3 rounded-lg text-sm">
						{{ error }}
						<button @click="error = null" class="float-right">×</button>
					</div>
				</UForm>

				<div class="mt-8">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t" style="border-color: var(--border-light)"></div>
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="px-4 bg-white text-minimal-secondary">Don't have an account?</span>
						</div>
					</div>
					<div class="mt-4 text-center">
						<p class="text-sm text-minimal-muted">Contact your administrator to get access</p>
					</div>
				</div>
			</div>
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

// Initialize auth and redirect if already authenticated
const { isAuthenticated, initializeAuth } = useAuth()

// Initialize auth on client side
onMounted(() => {
	initializeAuth()
})

// Watch for authentication changes and redirect
watch(
	isAuthenticated,
	newValue => {
		if (newValue) {
			router.push('/dashboard')
		}
	},
	{ immediate: true }
)
</script>
