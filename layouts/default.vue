<template>
  <div class="h-screen flex">
    <!-- Sidebar -->
    <USidebar class="w-64 bg-gray-50 border-r border-gray-200">
      <template #header>
        <div class="flex items-center gap-3 p-4 border-b border-gray-200">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-8 h-8 text-primary" />
          <div>
            <h1 class="font-bold text-lg">Admin Panel</h1>
            <p class="text-sm text-gray-500">Feature Management</p>
          </div>
        </div>
      </template>

      <UNavigationTree
        :links="navigation"
        :multiple="false"
        default-open
      />
    </USidebar>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ pageTitle }}
            </h1>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- User Menu -->
            <UDropdown
              v-if="user"
              :items="userMenuItems"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                color="gray"
                variant="ghost"
                :label="user.email"
                trailing-icon="i-heroicons-chevron-down-20-solid"
              />
            </UDropdown>
            
            <!-- Logout Button -->
            <UButton
              color="red"
              variant="outline"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="handleLogout"
            >
              Logout
            </UButton>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
const route = useRoute()

// Navigation links
const navigation = [
  {
    label: 'Dashboard',
    icon: 'i-heroicons-home',
    to: '/dashboard'
  },
  {
    label: 'Feature Flags',
    icon: 'i-heroicons-flag',
    to: '/flags',
    children: [
      {
        label: 'All Flags',
        to: '/flags'
      },
      {
        label: 'Add Flag',
        to: '/flags/new'
      },
      {
        label: 'Evaluate',
        to: '/flags/evaluate'
      }
    ]
  },
  {
    label: 'Users',
    icon: 'i-heroicons-users',
    to: '/users',
    children: [
      {
        label: 'All Users',
        to: '/users'
      },
      {
        label: 'Add User',
        to: '/users/new'
      },
      {
        label: 'Profile',
        to: '/users/profile'
      }
    ]
  },
  {
    label: 'Groups',
    icon: 'i-heroicons-user-group',
    to: '/groups',
    children: [
      {
        label: 'All Groups',
        to: '/groups'
      },
      {
        label: 'Add Group',
        to: '/groups/new'
      }
    ]
  }
]

// User menu items
const userMenuItems = [
  [{
    label: user.value?.email || '',
    slot: 'account',
    disabled: true
  }],
  [{
    label: 'Profile',
    icon: 'i-heroicons-user',
    click: () => navigateTo('/users/profile')
  }],
  [{
    label: 'Settings',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => console.log('Settings')
  }]
]

// Dynamic page title based on route
const pageTitle = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean)
  
  if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
    return 'Dashboard'
  }
  
  const titles: Record<string, string> = {
    flags: 'Feature Flags',
    users: 'Users',
    groups: 'Groups'
  }
  
  return titles[pathSegments[0]] || 'Admin Panel'
})

// Handle logout
const handleLogout = async () => {
  try {
    await logout()
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Initialize auth when layout mounts
onMounted(() => {
  const { initializeAuth } = useAuth()
  initializeAuth()
})
</script>