<script setup lang="ts">
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
    <h1 class="text-2xl md:text-3xl font-bold text-primary">{{ name }}</h1>
    <Button icon="pi pi-refresh" class="text-black hover:text-primary rounded-full p-1" @click="$emit('click')"
      unstyled />
  </div>
</template>
