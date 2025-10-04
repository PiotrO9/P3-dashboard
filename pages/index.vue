<script setup lang="ts">
import { navigateTo } from 'nuxt/app'

definePageMeta({
	middleware: 'auth',
})

await navigateTo('/dashboard')
</script>
<template></template>
