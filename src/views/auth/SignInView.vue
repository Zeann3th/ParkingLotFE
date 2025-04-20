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

      const redirectPath = route.query.redirect || '/dashboard';
      router.push(redirectPath as string);
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
  <div class="min-h-screen bg-secondary flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <div class="bg-secondary bg-opacity-80 shadow-xl rounded-xl p-8 space-y-6 backdrop-blur-sm">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-primary mb-2">Welcome back</h1>
          <p class="text-sm text-gray-800">Sign in to your account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-black mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="Enter your username"
                class="w-full !focus:border-primary !focus:ring !focus:ring-primary !focus:ring-opacity-50 !bg-white !text-black !px-3 !py-2"
                :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div class="relative">
                <InputText id="password" :type="showPassword ? 'text' : 'password'" v-model="password"
                  placeholder="Enter your password"
                  class="w-full !focus:border-primary !focus:ring !focus:ring-primary !focus:ring-opacity-50 !bg-white !text-black !px-3 !py-2"
                  :disabled="isSubmitted" required />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary/80 focus:outline-none">
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

          <Button type="submit" :disabled="isSubmitted" class="w-full py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800
            disabled:opacity-70 disabled:cursor-not-allowed transition duration-200" unstyled>
            {{ isSubmitted ? "Signing in..." : "Sign In" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-800">
            Don't have an account?
            <RouterLink to="/sign-up"
              class="font-medium text-primary hover:text-primary/80 transition-colors duration-200">
              Sign up now
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
