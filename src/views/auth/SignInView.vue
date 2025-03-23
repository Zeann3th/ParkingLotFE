<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const username = ref('');
const password = ref('');
const isSubmitted = ref(false);
const errorMessage = ref('');

const handleSubmit = async (event: Event) => {
  event.preventDefault();
  errorMessage.value = '';
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
      router.push('/');
    } else {
      errorMessage.value = message || 'Sign in failed';
    }
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'An error occurred';
  } finally {
    isSubmitted.value = false;
  }
}

</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
        <p class="mt-2 text-sm text-gray-400">Sign in your account</p>
      </div>

      <form @submit="handleSubmit" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input id="username" type="text" placeholder="Phoenix" v-model="username" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" type="password" placeholder="Password" v-model="password" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
          </div>
        </div>

        <div>
          <button type="submit" :disabled="isSubmitted"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-green-500 group-hover:text-green-400" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd" />
              </svg>
            </span>
            {{ isSubmitted ? "Signing in..." : "Sign in" }}
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="mt-2 text-red-500 text-sm">{{ errorMessage }}</p>

      <div class="text-center mt-4">
        <p class="text-sm text-gray-400">
          Don't have an account?
          <RouterLink to="/sign-up"
            class="font-medium text-green-500 hover:text-green-400 cursor-pointer transition-colors duration-200">
            Sign up now!
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
