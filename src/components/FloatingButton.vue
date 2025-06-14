<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineProps({
  icon: {
    type: String,
    default: '+',
  },
})
defineEmits(['click'])
</script>

<template>
  <Button
      @click="$emit('click')"
      class="fixed bottom-6 right-6 w-14 h-14 p-0 flex items-center justify-center rounded-full shadow-lg text-2xl font-light z-50 bg-gray-900 text-white hover:bg-gray-800 border-none transition-all duration-200 hover:scale-105 hover:shadow-xl"
  >
    {{ icon }}
  </Button>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

* {
  font-family: 'Inter', sans-serif;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}
</style>
