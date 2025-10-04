<template>
	<div class="max-w-4xl mx-auto space-y-6 p-6">
		<div>
			<h1 class="text-2xl font-semibold text-minimal-primary">User Profile</h1>
			<p class="mt-1 text-minimal-secondary">Manage your account settings and personal information</p>
		</div>

		<div class="minimal-card">
			<div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
				<h2 class="text-lg font-medium text-minimal-primary">Personal Information</h2>
				<button class="btn-minimal-outline text-sm" @click="toggleEditMode">
					{{ isEditing ? 'Cancel' : 'Edit Profile' }}
				</button>
			</div>

			<form @submit.prevent="saveProfile" class="space-y-6">
				<div class="flex items-center space-x-6 flex-wrap gap-4">
					<div>
						<div class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
							<UIcon name="i-heroicons-user" class="w-8 h-8 text-minimal-muted" />
						</div>
						<button
							v-if="isEditing"
							type="button"
							class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
						>
							<UIcon name="i-heroicons-camera" class="w-3 h-3 text-white" />
						</button>
					</div>
					<div>
						<h3 class="text-minimal-primary font-medium">Profile Photo</h3>
						<p class="text-sm text-minimal-muted">Upload a new avatar or change existing one</p>
					</div>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Full Name</label>
						<input
							v-model="profileData.fullName"
							:disabled="!isEditing"
							type="text"
							placeholder="Enter your full name"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Email Address</label>
						<input
							v-model="profileData.email"
							:disabled="!isEditing"
							type="email"
							placeholder="Enter your email"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Phone Number</label>
						<input
							v-model="profileData.phone"
							:disabled="!isEditing"
							type="tel"
							placeholder="Enter your phone number"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Department</label>
						<select
							v-model="profileData.department"
							:disabled="!isEditing"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						>
							<option value="">Select department</option>
							<option value="engineering">Engineering</option>
							<option value="product">Product</option>
							<option value="marketing">Marketing</option>
							<option value="sales">Sales</option>
							<option value="support">Support</option>
							<option value="hr">Human Resources</option>
						</select>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Role</label>
						<input
							v-model="profileData.role"
							:disabled="!isEditing"
							type="text"
							placeholder="Enter your role"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						/>
					</div>

					<div class="space-y-2">
						<label class="text-sm font-medium text-minimal-primary">Location</label>
						<input
							v-model="profileData.location"
							:disabled="!isEditing"
							type="text"
							placeholder="Enter your location"
							class="input-minimal w-full"
							:class="{ 'opacity-60': !isEditing }"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium text-minimal-primary">Bio</label>
					<textarea
						v-model="profileData.bio"
						:disabled="!isEditing"
						rows="4"
						placeholder="Tell us about yourself..."
						class="input-minimal w-full resize-none"
						:class="{ 'opacity-60': !isEditing }"
					></textarea>
				</div>

				<div v-if="isEditing" class="flex justify-end space-x-3">
					<button type="button" class="btn-minimal-ghost" @click="cancelEdit">Cancel</button>
					<button type="submit" class="btn-minimal" :disabled="saving">
						{{ saving ? 'Saving...' : 'Save Changes' }}
					</button>
				</div>
			</form>
		</div>

		<div class="minimal-card">
			<h2 class="text-lg font-medium text-minimal-primary mb-6">Account Security</h2>

			<div class="space-y-4">
				<div
					class="flex items-center justify-between p-4 border rounded-lg"
					style="border-color: var(--border-light)"
				>
					<div>
						<h3 class="text-minimal-primary font-medium">Password</h3>
						<p class="text-sm text-minimal-muted">Last changed 30 days ago</p>
					</div>
					<button class="btn-minimal-outline text-sm">Change Password</button>
				</div>

				<div
					class="flex items-center justify-between p-4 border rounded-lg"
					style="border-color: var(--border-light)"
				>
					<div>
						<h3 class="text-minimal-primary font-medium">Active Sessions</h3>
						<p class="text-sm text-minimal-muted">Manage your logged-in devices</p>
					</div>
					<button class="btn-minimal-outline text-sm">View Sessions</button>
				</div>
			</div>
		</div>

		<div class="minimal-card">
			<h2 class="text-lg font-medium text-minimal-primary mb-6">Preferences</h2>

			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-minimal-primary font-medium">Language</h3>
						<p class="text-sm text-minimal-muted">Choose your preferred language</p>
					</div>
					<select v-model="preferences.language" class="input-minimal w-32">
						<option value="en">English</option>
						<option value="pl">Polish</option>
						<option value="de">German</option>
						<option value="fr">French</option>
					</select>
				</div>

				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-minimal-primary font-medium">Timezone</h3>
						<p class="text-sm text-minimal-muted">Your local timezone for date/time display</p>
					</div>
					<select v-model="preferences.timezone" class="input-minimal w-48">
						<option value="UTC">UTC (GMT+0:00)</option>
						<option value="Europe/Warsaw">Europe/Warsaw (GMT+1:00)</option>
						<option value="Europe/London">Europe/London (GMT+0:00)</option>
						<option value="America/New_York">America/New_York (GMT-5:00)</option>
					</select>
				</div>
			</div>

			<div class="flex justify-end mt-6">
				<button class="btn-minimal" @click="savePreferences" :disabled="savingPreferences">
					{{ savingPreferences ? 'Saving...' : 'Save Preferences' }}
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

definePageMeta({
	middleware: 'auth',
})
const isEditing = ref(false)
const saving = ref(false)
const savingPreferences = ref(false)

const profileData = reactive({
	fullName: '',
	email: '',
	phone: '',
	department: '',
	role: '',
	location: '',
	bio: '',
})

const originalProfileData = reactive({})

const preferences = reactive({
	emailNotifications: true,
	browserNotifications: false,
	language: 'en',
	timezone: 'Europe/Warsaw',
})

const toggleEditMode = () => {
	if (isEditing.value) {
		cancelEdit()
		Object.assign(originalProfileData, profileData)
	}
}

const cancelEdit = () => {
	Object.assign(profileData, originalProfileData)
	isEditing.value = false
}

const saveProfile = async () => {
	saving.value = true
	try {
		await new Promise(resolve => setTimeout(resolve, 1000))
		Object.assign(originalProfileData, profileData)
		isEditing.value = false
	} catch (error) {
	} finally {
		saving.value = false
	}
}

const savePreferences = async () => {
	savingPreferences.value = true
	try {
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000))
		// Show success message
	} catch (error) {
		console.error('Failed to save preferences:', error)
	} finally {
		savingPreferences.value = false
	}
}

const loadUserProfile = async () => {
	try {
		// Simulate loading user data - replace with actual API call

		// Mock data - replace with actual user data
		Object.assign(profileData, {
			fullName: user.value?.name || 'John Doe',
			email: user.value?.email || 'john@example.com',
			phone: '+1 (555) 123-4567',
			role: 'Senior Developer',
			location: 'Warsaw, Poland',
			bio: 'Passionate developer with 5+ years of experience in web technologies.',
		})

		// Store original data
		Object.assign(originalProfileData, profileData)
	} catch (error) {
		console.error('Failed to load user profile:', error)
	}
}

// Initialize data on component mount
onMounted(() => {
	loadUserProfile()
})
</script>
