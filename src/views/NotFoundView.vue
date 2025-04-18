<script setup lang="ts">
import router from '@/router';
import Button from 'primevue/button';
</script>

<template>
  <div class="min-h-screen bg-secondary flex items-center justify-center px-4 py-8 transition-colors duration-300">
    <div class="w-full max-w-md text-center">
      <h1 class="text-6xl sm:text-7xl md:text-8xl font-bold text-primary mb-4">404</h1>
      <p class="text-lg sm:text-xl text-primary/80 mb-8">Oops! The page you're looking for doesn't
        exist.</p>
      <Button @click="() => router.push('/dashboard')" label="Go Home" class="px-6 py-3 bg-primary text-white rounded-full font-medium
               hover:bg-primary/80
               focus:outline-none focus:ring-2 focus:ring-offset-2
               focus:ring-primary
               transition-all duration-200 ease-in-out
               hover:scale-105 active:scale-100" unstyled />
    </div>
  </div>
</template>

<style scoped>
h1 {
  animation: float 3s ease-in-out infinite alternate;
}

@keyframes float {
  from {
    transform: translateY(0px);
  }

  to {
    transform: translateY(-8px);
  }
}
</style>
