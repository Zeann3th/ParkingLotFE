<script setup lang="ts">
import { Button } from '@/components/ui/button';

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
    <Button
        variant="ghost"
        size="icon"
        class="text-black hover:text-blue-600 rounded-full"
        @click="$emit('click')"
        aria-label="Refresh"
    >
      <span class="i-mdi:refresh text-xl" />
    </Button>
  </div>
</template>