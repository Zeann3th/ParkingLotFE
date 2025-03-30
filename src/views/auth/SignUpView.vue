<script setup lang="ts">
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

const username = ref('');
const password = ref('');
const name = ref('');
const email = ref('');
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
      email: email.value,
      name: name.value
    });

    if (status >= 200 && status < 300) {
      toast.add({
        severity: 'success',
        summary: 'Registration Successful',
        detail: 'Redirecting to sign in',
        life: 3000
      });

      setTimeout(() => {
        router.push('/sign-in');
      }, 1000);
    } else {
      toast.add({
        severity: 'error',
        summary: 'Registration Failed',
        detail: data.message || 'Sign up failed',
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
          <h1 class="text-3xl font-extrabold text-white mb-2">Create account</h1>
          <p class="text-sm text-gray-400">Sign up for a new account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="username" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <InputText id="name" v-model="name" placeholder="public name" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <InputText id="email" v-model="email" placeholder="example@gmail.com" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <InputText id="password" type="password" v-model="password" placeholder="password" class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />
            </div>

            <div>
              <label for="retypePassword" class="block text-sm font-medium text-gray-300 mb-2">
                Retype Password
              </label>
              <InputText id="retypePassword" type="password" v-model="retypePassword" placeholder="retype password"
                class="w-full py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed" :disabled="isSubmitted" required />

              <p v-if="passwordError" class="mt-2 text-red-500 text-sm">
                {{ passwordError }}
              </p>
              <p v-else-if="password && retypePassword && passwordsMatch" class="mt-2 text-green-500 text-sm">
                Passwords match
              </p>
            </div>
          </div>

          <Button type="submit" :disabled="isSubmitted || !passwordsMatch" class="w-full py-2 px-4 bg-green-600 text-white rounded-lg
                    hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    disabled:opacity-70 disabled:cursor-not-allowed">
            {{ isSubmitted ? "Signing up..." : "Sign up" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-400">
            Already have an account?
            <RouterLink to="/sign-in"
              class="font-medium text-green-500 hover:text-green-400 transition-colors duration-200">
              Sign in instead
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
