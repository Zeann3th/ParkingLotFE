<script setup lang="ts">
import Skeleton from 'primevue/skeleton';
</script>

<template>
  <!-- Skeleton Loading -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    <div v-for="n in 12" :key="n" class="bg-gray-800 bg-opacity-80 rounded-lg shadow p-4 backdrop-blur-sm">
      <Skeleton width="40%" height="2rem" class="mb-2 bg-gray-700" />
      <div class="flex space-x-6">
        <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
        <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
      </div>
    </div>
  </div>
</template>
