<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage and toggle your feature flags
        </p>
      </div>
      
      <UButton
        icon="i-heroicons-plus"
        size="lg"
        @click="navigateTo('/flags/new')"
      >
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
        :empty-state="{
          icon: 'i-heroicons-flag',
          label: 'No flags found',
          description: 'Create your first feature flag to get started.'
        }"
        class="w-full"
        @select="onSelect"
      >
        <!-- Custom column slots -->
        <template #name-data="{ row }">
          <div>
            <div class="font-medium text-gray-900">{{ row.name }}</div>
            <div class="text-sm text-gray-500">{{ row.key }}</div>
          </div>
        </template>

        <template #enabled-data="{ row }">
          <UToggle
            v-model="row.enabled"
            :loading="toggleLoading[row.id]"
            @update:model-value="toggleFlag(row)"
          />
        </template>

        <template #description-data="{ row }">
          <span class="text-gray-600 truncate max-w-xs block">
            {{ row.description || 'No description' }}
          </span>
        </template>

        <template #rules-data="{ row }">
          <div class="flex items-center gap-2">
            <UBadge
              :color="row.rules?.length ? 'blue' : 'gray'"
              variant="soft"
            >
              {{ row.rules?.length || 0 }} rules
            </UBadge>
            
            <UButton
              v-if="row.rules?.length"
              color="blue"
              variant="ghost"
              size="xs"
              @click="showRules(row)"
            >
              View
            </UButton>
          </div>
        </template>

        <template #actions-data="{ row }">
          <UDropdown
            :items="getRowActions(row)"
            :popper="{ placement: 'bottom-end' }"
          >
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-ellipsis-horizontal"
            />
          </UDropdown>
        </template>

        <template #createdAt-data="{ row }">
          <span class="text-sm text-gray-500">
            {{ new Date(row.createdAt).toLocaleDateString() }}
          </span>
        </template>
      </UTable>

      <!-- Bulk actions -->
      <div v-if="selected.length > 0" class="mt-4 p-4 bg-blue-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-blue-800">
            {{ selected.length }} flag(s) selected
          </span>
          
          <div class="flex gap-2">
            <UButton
              color="blue"
              variant="outline"
              size="sm"
              @click="bulkToggle(true)"
            >
              Enable Selected
            </UButton>
            
            <UButton
              color="blue"
              variant="outline"
              size="sm"
              @click="bulkToggle(false)"
            >
              Disable Selected
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Rules Modal -->
    <UModal v-model="rulesModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">
              Rules for "{{ selectedFlag?.name }}"
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="rulesModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- TODO: Implement rules management here -->
          <div v-if="selectedFlag?.rules?.length" class="space-y-2">
            <div
              v-for="rule in selectedFlag.rules"
              :key="rule.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <code class="text-sm">{{ rule.condition }}</code>
                <p class="text-xs text-gray-500 mt-1">
                  Returns: {{ rule.value ? 'true' : 'false' }}
                </p>
              </div>
              
              <UButton
                color="red"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                @click="deleteRule(selectedFlag.id, rule.id)"
              >
                Delete
              </UButton>
            </div>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500">
            No rules configured for this flag
          </div>
          
          <!-- Add rule form -->
          <UForm
            :schema="ruleSchema"
            :state="ruleState"
            @submit="addRule"
          >
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Condition" name="condition">
                <UInput
                  v-model="ruleState.condition"
                  placeholder="user.role === 'admin'"
                />
              </UFormGroup>
              
              <UFormGroup label="Return Value" name="value">
                <USelect
                  v-model="ruleState.value"
                  :options="[
                    { label: 'True', value: true },
                    { label: 'False', value: false }
                  ]"
                />
              </UFormGroup>
            </div>
            
            <UButton type="submit" class="mt-4">
              Add Rule
            </UButton>
          </UForm>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FeatureFlag, Rule } from '~/types'

// Add auth middleware
definePageMeta({
  middleware: 'auth'
})

const { flags } = useApi()
const toast = useToast()

// Data
const flagsList = ref<FeatureFlag[]>([])
const loading = ref(true)
const toggleLoading = ref<Record<string, boolean>>({})
const selected = ref<FeatureFlag[]>([])

// Filters
const search = ref('')
const statusFilter = ref('')

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Enabled', value: 'enabled' },
  { label: 'Disabled', value: 'disabled' }
]

// Table configuration
const columns = [
  {
    key: 'name',
    label: 'Name & Key'
  },
  {
    key: 'enabled',
    label: 'Status'
  },
  {
    key: 'description',
    label: 'Description'
  },
  {
    key: 'rules',
    label: 'Rules'
  },
  {
    key: 'createdAt',
    label: 'Created'
  },
  {
    key: 'actions',
    label: 'Actions'
  }
]

// Rules modal
const rulesModalOpen = ref(false)
const selectedFlag = ref<FeatureFlag | null>(null)

const ruleSchema = z.object({
  condition: z.string().min(1, 'Condition is required'),
  value: z.boolean()
})

const ruleState = reactive({
  condition: '',
  value: true
})

// Computed
const filteredFlags = computed(() => {
  let filtered = flagsList.value

  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    filtered = filtered.filter(flag =>
      flag.name.toLowerCase().includes(searchTerm) ||
      flag.key.toLowerCase().includes(searchTerm) ||
      flag.description?.toLowerCase().includes(searchTerm)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(flag => {
      if (statusFilter.value === 'enabled') return flag.enabled
      if (statusFilter.value === 'disabled') return !flag.enabled
      return true
    })
  }

  return filtered
})

// Methods
const loadFlags = async () => {
  try {
    loading.value = true
    const response = await flags.getAll()
    
    if (response.success) {
      flagsList.value = response.data
    } else {
      throw new Error(response.message)
    }
  } catch (error: any) {
    toast.add({
      title: 'Error loading flags',
      description: error.message,
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const toggleFlag = async (flag: FeatureFlag) => {
  try {
    toggleLoading.value[flag.id] = true
    
    const response = await flags.toggle(flag.id)
    
    if (response.success) {
      // Update local state
      const index = flagsList.value.findIndex(f => f.id === flag.id)
      if (index !== -1) {
        flagsList.value[index] = response.data
      }
      
      toast.add({
        title: `Flag ${response.data.enabled ? 'enabled' : 'disabled'}`,
        description: `"${flag.name}" is now ${response.data.enabled ? 'enabled' : 'disabled'}`,
        color: response.data.enabled ? 'green' : 'orange'
      })
    }
  } catch (error: any) {
    // Revert the toggle if it failed
    flag.enabled = !flag.enabled
    
    toast.add({
      title: 'Error toggling flag',
      description: error.message,
      color: 'red'
    })
  } finally {
    toggleLoading.value[flag.id] = false
  }
}

const bulkToggle = async (enabled: boolean) => {
  // TODO: Implement bulk operations
  console.log('Bulk toggle:', enabled, selected.value)
}

const showRules = (flag: FeatureFlag) => {
  selectedFlag.value = flag
  rulesModalOpen.value = true
}

const addRule = async () => {
  if (!selectedFlag.value) return
  
  try {
    const response = await flags.addRule(selectedFlag.value.id, ruleState)
    
    if (response.success) {
      // Refresh the flag data
      await loadFlags()
      
      // Reset form
      ruleState.condition = ''
      ruleState.value = true
      
      toast.add({
        title: 'Rule added',
        description: 'Rule has been successfully added',
        color: 'green'
      })
    }
  } catch (error: any) {
    toast.add({
      title: 'Error adding rule',
      description: error.message,
      color: 'red'
    })
  }
}

const deleteRule = async (flagId: string, ruleId: string) => {
  try {
    await flags.deleteRule(flagId, ruleId)
    
    // Refresh the flag data
    await loadFlags()
    
    toast.add({
      title: 'Rule deleted',
      description: 'Rule has been successfully deleted',
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error deleting rule',
      description: error.message,
      color: 'red'
    })
  }
}

const getRowActions = (flag: FeatureFlag) => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: () => navigateTo(`/flags/${flag.id}/edit`)
  }],
  [{
    label: 'Manage Rules',
    icon: 'i-heroicons-cog-6-tooth',
    click: () => showRules(flag)
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => console.log('Delete flag:', flag.id)
  }]
]

const onSelect = (row: FeatureFlag[]) => {
  selected.value = row
}

// Initialize
onMounted(() => {
  loadFlags()
})
</script>