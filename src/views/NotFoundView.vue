<script setup lang="ts">
import router from '@/router';
import { Button } from '@/components/ui/button';
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center px-4 py-8 transition-colors duration-300">
    <div class="w-full max-w-lg text-center">
      <!-- Animated 404 -->
      <div class="mb-8">
        <h1 class="text-7xl sm:text-8xl md:text-9xl font-light text-gray-900 mb-4 floating-number">
          <span class="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">404</span>
        </h1>
        <div class="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full mb-6 shadow-sm"></div>
      </div>

      <!-- Error Message -->
      <div class="space-y-4 mb-12">
        <h2 class="text-2xl sm:text-3xl font-medium text-gray-900">Page Not Found</h2>
        <p class="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
          The page you're looking for seems to have taken a wrong turn. Let's get you back on track.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <Button
            @click="() => router.push('/dashboard')"
            class="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out hover:scale-105 active:scale-100 shadow-lg hover:shadow-xl"
        >
          Back to Dashboard
        </Button>

        <div class="mt-6">
          <button
              @click="() => router.back()"
              class="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 underline decoration-blue-300 hover:decoration-blue-500 underline-offset-4"
          >
            Or go back to previous page
          </button>
        </div>
      </div>

      <!-- Decorative Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-200 rounded-full opacity-60 animate-pulse"></div>
        <div class="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-300 rounded-full opacity-40 animate-pulse delay-1000"></div>
        <div class="absolute bottom-1/4 right-1/4 w-3 h-3 bg-blue-100 rounded-full opacity-50 animate-pulse delay-500"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

* {
  font-family: 'Inter', sans-serif;
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.floating-number {
  animation: float 4s ease-in-out infinite alternate;
}

@keyframes float {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-12px);
  }
}

.transition-colors {
  transition-property: color, background-color, border-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.w-full {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-500 {
  animation-delay: 0.5s;
}

.delay-1000 {
  animation-delay: 1s;
}
</style>