<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

const username = ref('');
const password = ref('');
const isSubmitted = ref(false);

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  isSubmitted.value = true;

  try {
    const { status, data: { access_token, user: { name, role }, message } } = await axios.post('auth/login', {
      username: username.value,
      password: password.value
    });

    if (status >= 200 && status < 300) {
      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("name", name);
      sessionStorage.setItem("role", role);

      toast.add({
        severity: 'success',
        summary: 'Login Successful',
        detail: 'Redirecting to dashboard',
        life: 3000
      });

      setTimeout(() => {
        router.push('/');
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
      <div class="bg-gray-800 shadow-xl rounded-lg border border-gray-700 p-8 space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-extrabold text-white mb-2">Welcome back</h1>
          <p class="text-sm text-gray-400">Sign in to your account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="Phoenix" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <InputText id="password" type="password" v-model="password" placeholder="Password" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>
          </div>

          <Button type="submit" :disabled="isSubmitted" class="w-full py-2 px-4 bg-green-600 text-white rounded-lg
                    hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    disabled:opacity-70 disabled:cursor-not-allowed">
            {{ isSubmitted ? "Signing in..." : "Sign In" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-400">
            Don't have an account?
            <RouterLink to="/sign-up"
              class="font-medium text-green-500 hover:text-green-400 transition-colors duration-200">
              Sign up now!
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext) {
  width: 100%;
}
</style>
