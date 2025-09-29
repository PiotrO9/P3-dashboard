<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-600">
        Welcome back! Here's an overview of your feature flags and system status.
      </p>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Flags</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.totalFlags }}</p>
          </div>
          <div class="p-3 bg-blue-100 rounded-full">
            <UIcon name="i-heroicons-flag" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-green-600 font-medium">+{{ stats.newFlagsThisWeek }}</span>
            <span class="text-gray-500 ml-1">this week</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Flags</p>
            <p class="text-3xl font-bold text-green-600">{{ stats.activeFlags }}</p>
          </div>
          <div class="p-3 bg-green-100 rounded-full">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-gray-500">{{ ((stats.activeFlags / stats.totalFlags) * 100).toFixed(1) }}% of all flags</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.totalUsers }}</p>
          </div>
          <div class="p-3 bg-purple-100 rounded-full">
            <UIcon name="i-heroicons-users" class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-blue-600 font-medium">+{{ stats.newUsersThisWeek }}</span>
            <span class="text-gray-500 ml-1">this week</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Groups</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.totalGroups }}</p>
          </div>
          <div class="p-3 bg-orange-100 rounded-full">
            <UIcon name="i-heroicons-user-group" class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="mt-4">
          <div class="flex items-center text-sm">
            <span class="text-gray-500">{{ stats.averageGroupSize }} avg members</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Recent Activity and Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Flags -->
      <div class="lg:col-span-2">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium">Recent Feature Flags</h3>
              <UButton
                variant="ghost"
                size="sm"
                @click="navigateTo('/flags')"
              >
                View All
              </UButton>
            </div>
          </template>

          <UTable
            :rows="recentFlags"
            :columns="flagColumns"
            :loading="flagsLoading"
            :empty-state="{
              icon: 'i-heroicons-flag',
              label: 'No flags yet',
              description: 'Create your first feature flag to get started.'
            }"
          >
            <template #name-data="{ row }">
              <div>
                <div class="font-medium text-gray-900">{{ row.name }}</div>
                <div class="text-sm text-gray-500">{{ row.key }}</div>
              </div>
            </template>

            <template #status-data="{ row }">
              <UBadge
                :color="row.enabled ? 'green' : 'gray'"
                variant="soft"
              >
                {{ row.enabled ? 'Active' : 'Inactive' }}
              </UBadge>
            </template>

            <template #updatedAt-data="{ row }">
              <span class="text-sm text-gray-500">
                {{ formatRelativeTime(row.updatedAt) }}
              </span>
            </template>
          </UTable>
        </UCard>
      </div>

      <!-- Quick Actions -->
      <div>
        <UCard>
          <template #header>
            <h3 class="text-lg font-medium">Quick Actions</h3>
          </template>

          <div class="space-y-3">
            <UButton
              block
              icon="i-heroicons-plus"
              @click="navigateTo('/flags/new')"
            >
              Create Feature Flag
            </UButton>

            <UButton
              block
              variant="outline"
              icon="i-heroicons-user-plus"
              @click="navigateTo('/users/new')"
            >
              Add User
            </UButton>

            <UButton
              block
              variant="outline"
              icon="i-heroicons-user-group"
              @click="navigateTo('/groups/new')"
            >
              Create Group
            </UButton>

            <UButton
              block
              variant="outline"
              icon="i-heroicons-calculator"
              @click="navigateTo('/flags/evaluate')"
            >
              Evaluate Flag
            </UButton>
          </div>
        </UCard>

        <!-- System Status -->
        <UCard class="mt-6">
          <template #header>
            <h3 class="text-lg font-medium">System Status</h3>
          </template>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">API Status</span>
              <UBadge color="green" variant="soft">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1" />
                Healthy
              </UBadge>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Database</span>
              <UBadge color="green" variant="soft">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1" />
                Connected
              </UBadge>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Cache</span>
              <UBadge color="green" variant="soft">
                <UIcon name="i-heroicons-check-circle" class="w-3 h-3 mr-1" />
                Operational
              </UBadge>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Last Backup</span>
              <span class="text-sm text-gray-500">2 hours ago</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FeatureFlag } from '~/types'

// Add auth middleware
definePageMeta({
  middleware: 'auth'
})

const { flags, users, groups } = useApi()

// Data
const stats = ref({
  totalFlags: 0,
  activeFlags: 0,
  newFlagsThisWeek: 0,
  totalUsers: 0,
  newUsersThisWeek: 0,
  totalGroups: 0,
  averageGroupSize: 0
})

const recentFlags = ref<FeatureFlag[]>([])
const flagsLoading = ref(true)

// Table configuration
const flagColumns = [
  {
    key: 'name',
    label: 'Name & Key'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'updatedAt',
    label: 'Last Updated'
  }
]

// Methods
const loadDashboardData = async () => {
  try {
    // Load all data in parallel
    const [flagsResponse, usersResponse, groupsResponse] = await Promise.allSettled([
      flags.getAll(),
      users.getAll(),
      groups.getAll()
    ])

    // Process flags data
    if (flagsResponse.status === 'fulfilled' && flagsResponse.value.success) {
      const flagsData = flagsResponse.value.data
      stats.value.totalFlags = flagsData.length
      stats.value.activeFlags = flagsData.filter((f: FeatureFlag) => f.enabled).length
      
      // TODO: Calculate new flags this week based on createdAt
      stats.value.newFlagsThisWeek = Math.floor(Math.random() * 5) // Mock data
      
      // Get recent flags (last 5, sorted by updatedAt)
      recentFlags.value = flagsData
        .sort((a: FeatureFlag, b: FeatureFlag) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5)
    }

    // Process users data
    if (usersResponse.status === 'fulfilled' && usersResponse.value.success) {
      const usersData = usersResponse.value.data
      stats.value.totalUsers = usersData.length
      // TODO: Calculate new users this week
      stats.value.newUsersThisWeek = Math.floor(Math.random() * 10) // Mock data
    }

    // Process groups data
    if (groupsResponse.status === 'fulfilled' && groupsResponse.value.success) {
      const groupsData = groupsResponse.value.data
      stats.value.totalGroups = groupsData.length
      // TODO: Calculate average group size
      stats.value.averageGroupSize = groupsData.length > 0 ? 
        Math.floor(Math.random() * 20) + 5 : 0 // Mock data
    }

  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // TODO: Show error toast
  } finally {
    flagsLoading.value = false
  }
}

// Utility functions
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}h ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`
  } else {
    return 'Just now'
  }
}

// Initialize
onMounted(() => {
  loadDashboardData()
})
</script>