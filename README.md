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
    - New advanced targeting supports GROUP and ATTRIBUTE rules (see API docs below)
- ✅ **Flag Evaluation (`/flags/evaluate`)** - Advanced testing interface (userId, groups, attributes) hitting internal `/api/flags/evaluate` endpoint
- 🔄 Add/Edit forms (TODO: implement POST /flags, PUT /flags/:id)
- ✅ Advanced Targeting UI on edit page: add/delete GROUP & ATTRIBUTE rules with validation

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

## 🔐 Authentication (Updated: HTTP-only Cookies)

Authentication now uses secure, HTTP-only cookies to store the session token. The token is never exposed to client-side JavaScript, reducing XSS risk.

How it works:

- POST `/api/auth/login` (internal) forwards credentials to external API `/users/login`.
- Server sets `auth.token` as `httpOnly`, `sameSite=lax`, `secure` in production.
- Client receives only the `user` object (stored in a non-HTTP-only `auth.user` cookie for hydration).
- All subsequent API calls go through `/api/proxy/*`, where the server injects the `Authorization: Bearer <token>` header using the httpOnly cookie.
- Logout: POST `/api/auth/logout` clears the token cookie.

Key files:

- `server/api/auth/login.post.ts`
- `server/api/auth/logout.post.ts`
- `server/api/proxy/[...path].ts`
- `composables/useAuth.ts`
- `composables/useApi.ts`

Middleware now only checks for the presence of a valid `auth.user` cookie.

Benefits:

- Token not accessible via `document.cookie` or JS.
- Centralized auth header injection.
- Simplified client composables.

Previous localStorage/token logic has been removed.

Usage example:

```ts
const { login, logout, user, isAuthenticated } = useAuth()
await login({ email, password })
await logout()
```

API usage remains unchanged in pages/components because `useApi` internally routes through the proxy.

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

## 🎯 Advanced Flag Rules (Targeting)

This project introduces an extensible targeting model allowing you to attach audience rules to a feature flag.

### Endpoint: Add Rule

POST `/api/flags/{flagId}/rules`

Body (one of):

GROUP rule:

```json
{
	"targetingType": "GROUP",
	"groupId": "beta-testers"
}
```

ATTRIBUTE rule examples:

```json
{ "targetingType": "ATTRIBUTE", "attribute": "country", "operator": "EQUALS", "value": "PL" }
{ "targetingType": "ATTRIBUTE", "attribute": "role", "operator": "IN", "value": ["ADMIN","SUPERUSER"] }
{ "targetingType": "ATTRIBUTE", "attribute": "age", "operator": "GREATER_THAN", "value": 25 }
```

Validation errors (400):

- Missing `targetingType`
- GROUP: missing `groupId`
- ATTRIBUTE: missing any of `attribute`, `operator`, `value`
- Operator/value mismatch (e.g. IN requires array)

404: Flag not found

Response:

```json
{
	"success": true,
	"rule": {
		/* created rule */
	}
}
```

### Endpoint: Delete Rule

DELETE `/api/flags/rules/{ruleId}`

Responses:

- 200 `{ success: true }`
- 404 rule not found

### Rule Data Model

```ts
type TargetingType = 'GROUP' | 'ATTRIBUTE'
type AttributeOperator =
	| 'EQUALS'
	| 'IN'
	| 'NOT_IN'
	| 'GREATER_THAN'
	| 'LESS_THAN'
	| 'GREATER_OR_EQUAL'
	| 'LESS_OR_EQUAL'

interface GroupFlagRule {
	id
	flagId
	targetingType: 'GROUP'
	groupId
	createdAt
}
interface AttributeFlagRule {
	id
	flagId
	targetingType: 'ATTRIBUTE'
	attribute
	operator
	value
	createdAt
}
```

### Evaluation Semantics

1. Collect all rules for a flag.
2. If there are no rules → matched = true (flag applies to everyone).
3. If any rule matches the user context → matched = true, else false.
4. Result by flag type when matched = false:
    - BOOLEAN → false
    - PERCENTAGE → false
    - CONFIG → null
5. When matched = true:
    - BOOLEAN → returns flag.enabled
    - PERCENTAGE → deterministic hash of userId against rolloutPercentage
    - CONFIG → returns configJson

### Matching Logic

GROUP rule matches if `groupId` ∈ `userContext.groups`.

ATTRIBUTE rule operators:

- EQUALS: attr === value
- IN: value is array and includes attr
- NOT_IN: array does not include attr
- GREATER_THAN / LESS_THAN / GREATER_OR_EQUAL / LESS_OR_EQUAL: numeric comparison after coercion

### Example User Context

```ts
const ctx = {
	userId: 'u_123',
	groups: ['beta-testers', 'internal'],
	attributes: { country: 'PL', role: 'ADMIN', age: 31 },
}
```

### Sample Evaluation Flow

```ts
import { evaluateFlag } from '@/server/utils/evaluateFlag'
const result = evaluateFlag(flag, ctx)
// result.matched (boolean), result.value (depends on flag type)
```

### UI Evaluation Tool (`/flags/evaluate`)

The evaluation page now lets you interactively test flags with rich context:

Inputs:

- Select existing flag (dropdown auto-populated) or type a key manually
- Optional User ID (enables deterministic % rollout evaluation)
- User Attributes JSON (arbitrary key/value pairs) sent as `userAttributes`

Output:

- Badge showing boolean or truthiness of value
- Matched indicator (whether any targeting rule matched)
- Raw JSON response (expandable accordion)
- Recent evaluations history (in-memory, per session) with re-run & load-context shortcuts

Behavior:

1. Builds request `{ flagKey, userId?, userAttributes? }` hitting external Fastify `/evaluate` via proxy
2. Handles invalid JSON gracefully with toast error
3. Maintains up to 15 history entries (clearing is manual)

Extending:

- Add rule trace: adapt `evaluateFlag` util to include array of matched rule IDs (return shape `{ matched, value, trace: [...] }`).
- Add attribute builder UI (key/value dynamic rows) and synthesize JSON on submission.
- Persist history in localStorage for cross-session recall.

### Notes

- Current implementation uses an in-memory store (`global.__flagsStore`) as a placeholder.
- Replace with real persistence (DB) before production.
- Easy to extend with future targeting types (e.g. SEGMENT) by adding new union members.

### Additional Supporting Endpoints (In-Memory Demo)

These endpoints exist only in the current demo (no persistence) to help you experiment:

Create Flag:

```
POST /api/flags
{
  "key": "checkout_redesign",
  "type": "PERCENTAGE",        // optional: BOOLEAN | PERCENTAGE | CONFIG (default BOOLEAN)
  "enabled": true,
  "rolloutPercentage": 25,       // for PERCENTAGE
  "configJson": { "color": "red" } // for CONFIG
}
```

Response:

```
{ "success": true, "flag": { ... } }
```

List Rules for a Flag:

```
GET /api/flags/{flagId}/rules
=> { "success": true, "rules": [ ... ] }
```

Evaluate Flag:

```
POST /api/flags/evaluate
{
  "flagId": "<id>",            // or use "key"
  "context": {
    "userId": "u_123",
    "groups": ["beta-testers"],
    "attributes": { "country": "PL", "age": 30 }
  }
}
```

Response:

```
{ "success": true, "result": { "matched": true, "value": true } }
```

Delete Rule:

```
DELETE /api/flags/rules/{ruleId}
```

### Roadmap Toward Persistence

1. Introduce Prisma schema: `FeatureFlag`, `FlagRule` tables.
2. Migrate in-memory helper `flagStore` to repository layer.
3. Add audit log for rule changes.
4. Add optimistic UI updates with rollback on error.
5. Implement caching (L2 in-memory + DB invalidation on writes).
