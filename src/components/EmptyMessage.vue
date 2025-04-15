<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Button from 'primevue/button';
defineProps({
  message: {
    type: String
  },
  icon: {
    type: String,
    default: 'pi pi-exclamation-triangle'
  },
})
defineEmits(['click']);
</script>

<template>
  <div class="text-center py-12 bg-secondary dark:bg-primary bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
    <i :class="[icon, 'text-6xl text-primary dark:text-secondary mb-4']"></i>
    <p class="text-lg text-primary dark:text-secondary">{{ message }}</p>
    <Button label="Refresh" icon="pi pi-refresh" class="mt-4" @click="$emit('click')" />
  </div>
</template>
