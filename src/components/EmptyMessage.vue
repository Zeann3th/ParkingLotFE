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
  <div class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
    <i :class="[icon, 'text-6xl text-gray-600 mb-4']"></i>
    <p class="text-lg text-gray-400">{{ message }}</p>
    <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
      @click="$emit('click')" />
  </div>
</template>
