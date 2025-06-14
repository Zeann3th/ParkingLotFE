<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

defineProps({
  message: {
    type: String,
    required: true,
  },
  icon: {
    type: Object,
    default: () => AlertTriangle,
  },
})
defineEmits(['click']);
</script>

<template>
  <div class="text-center py-16 px-6 bg-white rounded-2xl shadow border border-gray-100 backdrop-blur-sm">
    <div class="max-w-md mx-auto">
      <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 group">
        <component :is="icon" class="w-8 h-8 text-blue-600 group-hover:text-blue-800 transition-colors duration-200" />
      </div>

      <p class="text-lg text-gray-600 mb-8 leading-relaxed">{{ message }}</p>

      <Button @click="$emit('click')" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full">
        <RefreshCw class="w-4 h-4 mr-2" />
        Refresh
      </Button>
    </div>
  </div>
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
