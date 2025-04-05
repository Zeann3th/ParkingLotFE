<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { memoryStorage } from '@/storage';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const username = ref('');
const password = ref('');
const isSubmitted = ref(false);
const showPassword = ref(false);

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  isSubmitted.value = true;

  try {
    const { status, data: { access_token, message } } = await axios.post('auth/login', {
      username: username.value,
      password: password.value
    });

    if (status >= 200 && status < 300) {
      memoryStorage.setToken(access_token);

      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Redirecting to dashboard',
        life: 3000
      });

      setTimeout(() => {
        const redirectPath = route.query.redirect || '/dashboard';
        router.push(redirectPath as string);
      }, 1000);
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login Failed',
        detail: message || 'Sign in failed',
        life: 3000
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'An error occurred',
      life: 3000
    });
  } finally {
    isSubmitted.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <div class="bg-gray-800 bg-opacity-80 shadow-xl rounded-xl border border-gray-700 p-8 space-y-6 backdrop-blur-sm">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-green-400 mb-2">Welcome back</h1>
          <p class="text-sm text-gray-400">Sign in to your account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="Enter your username" class="w-full py-2 px-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400" :disabled="isSubmitted"
                required />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div class="relative">
                <InputText id="password" :type="showPassword ? 'text' : 'password'" v-model="password"
                  placeholder="Enter your password" class="w-full py-2 px-3 bg-gray-700 bg-opacity-70 border border-gray-600 rounded-lg text-white 
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400" :disabled="isSubmitted"
                  required />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-400 focus:outline-none">
                  <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24">
                    </path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <Button type="submit" :disabled="isSubmitted" class="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800
            disabled:opacity-70 disabled:cursor-not-allowed transition duration-200">
            {{ isSubmitted ? "Signing in..." : "Sign In" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-400">
            Don't have an account?
            <RouterLink to="/sign-up"
              class="font-medium text-green-400 hover:text-green-300 transition-colors duration-200">
              Sign up now
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.input-text:focus {
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.2);
}
</style>
