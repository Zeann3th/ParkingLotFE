<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import Button from 'primevue/button';

defineProps({
  name: {
    type: String
  }
})
defineEmits(['click']);
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl md:text-3xl font-bold text-green-400">{{ name }}</h1>
    <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400" @click="$emit('click')" />
  </div>
</template>
