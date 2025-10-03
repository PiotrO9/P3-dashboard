<script setup lang="ts">
import { navigateTo } from 'nuxt/app'

// Redirect to dashboard
definePageMeta({
	middleware: 'auth',
})

// Additional redirect logic
await navigateTo('/dashboard')
</script>
<template></template>
