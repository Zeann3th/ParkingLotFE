<script setup lang="ts">
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const username = ref('');
const password = ref('');
const name = ref('');
const retypePassword = ref('');
const isSubmitted = ref(false);
const passwordError = ref('');
const errorMessage = ref('');

const passwordsMatch = computed(() => {
  return password.value === retypePassword.value;
});

const validateForm = () => {
  passwordError.value = '';
  errorMessage.value = '';

  if (password.value !== retypePassword.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }

  return true;
}

const handleSubmit = async (event: Event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  isSubmitted.value = true;

  try {
    const { status, data } = await axios.post('auth/register', {
      username: username.value,
      password: password.value,
      name: name.value
    });

    if (status >= 200 && status < 300) {
      router.push('/sign-in');
    } else {
      errorMessage.value = data.message || 'Sign up failed';
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
        <h1 class="text-3xl font-extrabold tracking-tight text-white">Create account</h1>
        <p class="mt-2 text-sm text-gray-400">Sign up for a new account</p>
      </div>

      <form @submit="handleSubmit" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm space-y-4">
          <div>
            <label for="username" class="sr-only">Username</label>
            <input id="username" type="text" placeholder="Phoenix" v-model="username" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
          </div>
          <div>
            <label for="name" class="sr-only">Name</label>
            <input id="name" type="text" placeholder="Your public name" v-model="name" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input id="password" type="password" placeholder="Password" v-model="password" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
          </div>
          <div>
            <label for="retypePassword" class="sr-only">Retype Password</label>
            <input id="retypePassword" type="password" placeholder="Retype Password" v-model="retypePassword" required
              class="w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" />
            <p v-if="passwordError" class="mt-2 text-red-500 text-sm">{{ passwordError }}</p>
            <p v-else-if="password && retypePassword && passwordsMatch" class="mt-2 text-green-500 text-sm">
              Passwords match
            </p>
          </div>
        </div>

        <div>
          <button type="submit" :disabled="isSubmitted || !passwordsMatch"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed">
            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="h-5 w-5 text-green-500 group-hover:text-green-400" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd" />
              </svg>
            </span>
            {{ isSubmitted ? "Signing up..." : "Sign up" }}
          </button>
        </div>
      </form>

      <p v-if="errorMessage" class="mt-2 text-red-500 text-sm">{{ errorMessage }}</p>

      <div class="text-center mt-4">
        <p class="text-sm text-gray-400">
          Already have an account?
          <RouterLink to="/sign-in"
            class="font-medium text-green-500 hover:text-green-400 cursor-pointer transition-colors duration-200">
            Sign in instead
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
