<script setup lang="ts">
import { getInitials, getRandomColor } from '@/utils';

defineProps({
  name: {
    type: String,
    default: "User"
  },
  id: {
    type: Number,
    default: 0
  }
});
</script>

<template>
  <div
      class="flex-shrink-0 mr-2 w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium"
      :style="{ backgroundColor: getRandomColor(id), color: '#fff' }"
      aria-label="User avatar"
  >
    {{ getInitials(name) }}
  </div>
</template>