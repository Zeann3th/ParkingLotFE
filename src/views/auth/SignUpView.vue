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

// Add password reveal toggles
const showPassword = ref(false);
const showRetypePassword = ref(false);

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
  <div
    class="relative min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-8 overflow-hidden">
    <!-- Decorative floating shapes -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="floating-shape shape1"></div>
      <div class="floating-shape shape2"></div>
      <div class="floating-shape shape3"></div>
    </div>

    <!-- Glass effect container -->
    <div class="w-full max-w-md relative z-10">
      <div class="backdrop-blur-xl bg-white/5 shadow-2xl rounded-2xl border border-white/10 p-8 space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-extrabold text-white mb-2">Create account</h1>
          <p class="text-sm text-blue-200">Sign up for a new account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-blue-200 mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="username" class="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-blue-300/30" :disabled="isSubmitted"
                required />
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-blue-200 mb-2">
                Name
              </label>
              <InputText id="name" v-model="name" placeholder="public name" class="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-blue-300/30" :disabled="isSubmitted"
                required />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-blue-200 mb-2">
                Email
              </label>
              <InputText id="email" v-model="email" type="email" placeholder="example@gmail.com" class="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-blue-300/30" :disabled="isSubmitted"
                required />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-blue-200 mb-2">
                Password
              </label>
              <div class="relative">
                <InputText id="password" :type="showPassword ? 'text' : 'password'" v-model="password"
                  placeholder="password" class="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed placeholder-blue-300/30" :disabled="isSubmitted"
                  required />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-200 focus:outline-none">
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

            <div>
              <label for="retypePassword" class="block text-sm font-medium text-blue-200 mb-2">
                Retype Password
              </label>
              <div class="relative">
                <InputText id="retypePassword" :type="showRetypePassword ? 'text' : 'password'" v-model="retypePassword"
                  placeholder="retype password" class="w-full py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white 
                  focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed placeholder-blue-300/30" :disabled="isSubmitted"
                  required />
                <button type="button" @click="showRetypePassword = !showRetypePassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-200 focus:outline-none">
                  <svg v-if="showRetypePassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24"
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

              <p v-if="passwordError" class="mt-2 text-red-400 text-sm">
                {{ passwordError }}
              </p>
              <p v-else-if="password && retypePassword && passwordsMatch" class="mt-2 text-blue-400 text-sm">
                Passwords match
              </p>
            </div>
          </div>

          <Button type="submit" :disabled="isSubmitted || !passwordsMatch" class="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg
            hover:from-blue-700 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
            disabled:opacity-70 disabled:cursor-not-allowed transition duration-200">
            {{ isSubmitted ? "Signing up..." : "Sign up" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-blue-200">
            Already have an account?
            <RouterLink to="/sign-in"
              class="font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Sign in instead
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.floating-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(40px);
  animation: float 20s infinite;
}

.shape1 {
  width: 300px;
  height: 300px;
  background: rgb(37, 99, 235);
  top: -100px;
  left: -100px;
  animation-delay: -2s;
}

.shape2 {
  width: 400px;
  height: 400px;
  background: rgb(29, 78, 216);
  bottom: -150px;
  right: -150px;
  animation-delay: -5s;
}

.shape3 {
  width: 200px;
  height: 200px;
  background: rgb(59, 130, 246);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -7s;
}

@keyframes float {

  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }

  25% {
    transform: translate(50px, 50px) rotate(90deg);
  }

  50% {
    transform: translate(0, 100px) rotate(180deg);
  }

  75% {
    transform: translate(-50px, 50px) rotate(270deg);
  }
}
</style>
