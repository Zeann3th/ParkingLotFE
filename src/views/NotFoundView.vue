<script setup lang="ts">
import { Button } from 'primevue';
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md text-center">
      <h1 class="text-6xl font-bold text-green-500 mb-4">404</h1>
      <p class="text-lg text-gray-300 mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Button @click="goHome"
        class="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
        Go Home
      </Button>
    </div>
  </div>
</template>
