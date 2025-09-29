# P3 Admin Dashboard

A minimal admin panel skeleton built with Nuxt 3, TypeScript, TailwindCSS, and NuxtUI for managing feature flags, users, and groups.

## 🏗️ Project Structure

```
P3-dashboard/
├── assets/
│   └── css/
│       └── main.css              # Tailwind CSS imports
├── components/                   # Reusable Vue components (add as needed)
├── composables/
│   ├── useApi.ts                # API integration layer
│   └── useAuth.ts               # Authentication state management
├── layouts/
│   └── default.vue              # Main app layout with sidebar navigation
├── middleware/
│   └── auth.ts                  # Authentication middleware for protected routes
├── pages/
│   ├── index.vue                # Root page (redirects to dashboard)
│   ├── login.vue                # Login form with email/password
│   ├── dashboard.vue            # Overview dashboard with stats and recent activity
│   ├── flags/
│   │   ├── index.vue           # Feature flags list with toggle functionality
│   │   └── evaluate.vue        # Flag evaluation testing interface
│   └── users/
│       └── index.vue           # Users management with CRUD operations
├── types/
│   └── index.ts                # TypeScript interfaces and types
├── nuxt.config.ts              # Nuxt 3 configuration
└── package.json                # Dependencies and scripts
```

## 🚀 Features Implemented

### Authentication

- ✅ Login page with UForm (email + password)
- ✅ Auth middleware protecting routes marked [AUTH]
- ✅ Logout functionality
- ✅ Auto-redirect based on authentication state

### Layout & Navigation

- ✅ Sidebar navigation using NuxtUI components
- ✅ Top bar with user info and logout button
- ✅ Responsive design with clean minimal interface

### Feature Flags Management

- ✅ **Flags List (`/flags`)** - UTable with toggle switches for PATCH /flags/:id/toggle
- ✅ Rules management modal (POST /flags/:id/rules, DELETE /flags/:id/rules)
- ✅ **Flag Evaluation (`/flags/evaluate`)** - Testing interface for POST /evaluate
- 🔄 Add/Edit forms (TODO: implement POST /flags, PUT /flags/:id)

### Users Management

- ✅ **Users List (`/users`)** - UTable from GET /users [AUTH]
- ✅ Delete functionality (DELETE /users/:id)
- 🔄 User details, add form, and profile pages (TODO)

### Dashboard

- ✅ Overview cards showing statistics from GET /flags, GET /users, GET /groups
- ✅ Recent flags table
- ✅ Quick action buttons
- ✅ System status indicators

### Groups Management

- 🔄 Complete groups management (TODO)

## 📝 Key Implementation: Feature Flags List Page

Here's the main **`pages/flags/index.vue`** implementation as requested:

\`\`\`vue
<template>

  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage and toggle your feature flags
        </p>
      </div>
      
      <UButton icon="i-heroicons-plus" size="lg" @click="navigateTo('/flags/new')">
        Add Flag
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium">All Flags</h3>
          <div class="flex gap-2">
            <UInput
              v-model="search"
              icon="i-heroicons-magnifying-glass"
              placeholder="Search flags..."
              class="w-64"
            />
            <USelect
              v-model="statusFilter"
              :options="statusOptions"
              placeholder="Filter by status"
              class="w-40"
            />
          </div>
        </div>
      </template>

      <UTable
        v-model="selected"
        :rows="filteredFlags"
        :columns="columns"
        :loading="loading"
        @select="onSelect"
      >
        <template #enabled-data="{ row }">
          <UToggle
            v-model="row.enabled"
            :loading="toggleLoading[row.id]"
            @update:model-value="toggleFlag(row)"
          />
        </template>

        <!-- Additional column templates... -->
      </UTable>
    </UCard>

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { flags } = useApi()
const toast = useToast()

// Toggle flag implementation
const toggleFlag = async (flag: FeatureFlag) => {
  try {
    toggleLoading.value[flag.id] = true
    const response = await flags.toggle(flag.id) // PATCH /flags/:id/toggle
    
    if (response.success) {
      // Update local state
      const index = flagsList.value.findIndex(f => f.id === flag.id)
      if (index !== -1) {
        flagsList.value[index] = response.data
      }
      
      toast.add({
        title: \`Flag \${response.data.enabled ? 'enabled' : 'disabled'}\`,
        color: response.data.enabled ? 'green' : 'orange'
      })
    }
  } catch (error: any) {
    flag.enabled = !flag.enabled // Revert on error
    toast.add({
      title: 'Error toggling flag',
      description: error.message,
      color: 'red'
    })
  } finally {
    toggleLoading.value[flag.id] = false
  }
}
</script>

\`\`\`

## 🔧 API Integration

The **`useApi`** composable provides typed methods for all backend endpoints:

\`\`\`typescript
const { flags, users, groups, auth } = useApi()

// Feature Flags
await flags.getAll() // GET /flags
await flags.toggle(id) // PATCH /flags/:id/toggle
await flags.addRule(id, rule) // POST /flags/:id/rules
await flags.evaluate(request) // POST /evaluate

// Authentication
await auth.login(credentials) // POST /users/login
await auth.logout() // POST /users/logout [AUTH]

// Users (all require AUTH)
await users.getAll() // GET /users [AUTH]
await users.getMe() // GET /users/me [AUTH]
await users.delete(id) // DELETE /users/:id [AUTH]
\`\`\`

## 🛡️ Authentication Middleware

Routes are protected using the **`auth.ts`** middleware:

\`\`\`typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
const { isAuthenticated } = useAuth()

if (!isAuthenticated.value) {
return navigateTo('/login')
}
})
\`\`\`

Pages use it with:
\`\`\`typescript
definePageMeta({
middleware: 'auth'
})
\`\`\`

## 🎨 NuxtUI Components Used

- **UTable** - Data tables with sorting and selection
- **UButton** - Action buttons with icons and loading states
- **UForm** - Form handling with validation
- **UInput** - Text inputs with icons
- **UToggle** - Toggle switches for feature flags
- **UCard** - Content containers with headers
- **UModal** - Modal dialogs for rules management
- **UBadge** - Status indicators
- **USidebar** & **UNavigationTree** - Sidebar navigation
- **UDropdown** - Action menus

## 🚀 Getting Started

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set API base URL:**
   \`\`\`bash

    # Create .env file

    API_BASE_URL=http://localhost:3001
    \`\`\`

3. **Run development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the application:**
    - Navigate to `http://localhost:3000`
    - Login page will be shown if not authenticated
    - Use the sidebar to navigate between sections

## 📋 TODO Items

### High Priority

- [ ] Implement POST /flags and PUT /flags/:id for flag creation/editing
- [ ] Complete user details, add form, and profile pages
- [ ] Implement full groups management (list, add/edit, member management)
- [ ] Add form validation schemas with Zod
- [ ] Error handling and loading states refinement

### Enhancement Opportunities

- [ ] Add pagination for large data sets
- [ ] Implement real-time updates with WebSocket
- [ ] Add keyboard shortcuts for power users
- [ ] Enhanced filtering and search capabilities
- [ ] Export/import functionality for flags and configurations
- [ ] Audit trail for flag changes
- [ ] Bulk operations for flags and users

## 🛠️ Development Notes

- **TypeScript**: Fully typed with interfaces in `types/index.ts`
- **Composables**: Logic abstracted into reusable composables
- **State Management**: Uses Nuxt 3's built-in `useState` for reactive state
- **API Layer**: Centralized API calls with error handling
- **Authentication**: Persistent auth state with localStorage
- **Responsive Design**: Mobile-friendly using Tailwind utilities
- **Performance**: Lazy loading and efficient data fetching

The codebase follows Nuxt 3 best practices and is ready for production deployment with additional features and refinements.
