<script setup lang="ts">
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div
    class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 py-8 transition-colors duration-300">
    <div class="w-full max-w-md text-center">
      <h1 class="text-6xl sm:text-7xl md:text-8xl font-bold text-green-600 dark:text-green-500 mb-4">404</h1>
      <p class="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8">Oops! The page you're looking for doesn't
        exist.</p>
      <Button @click="goHome" label="Go Home" class="px-6 py-3 bg-green-600 text-white rounded-lg font-medium
               hover:bg-green-700
               focus:outline-none focus:ring-2 focus:ring-offset-2
               focus:ring-green-500 dark:focus:ring-offset-gray-900
               transition-all duration-200 ease-in-out
               hover:scale-105 active:scale-100" />
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
