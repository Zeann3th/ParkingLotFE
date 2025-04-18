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

const showPassword = ref(false);
const showRetypePassword = ref(false);

const showPopUp = ref(false);
const verificationCode = ref('');
const isResending = ref(false);

const passwordsMatch = computed(() => {
  return password.value === retypePassword.value;
});

const validateForm = () => {
  passwordError.value = '';

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
        detail: 'Please check your email for verification code',
        life: 3000
      });
      showPopUp.value = true;
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

const handleVerifyEmail = async (event: Event) => {
  event.preventDefault();

  if (!verificationCode.value) {
    toast.add({
      severity: 'error',
      summary: 'Verification Failed',
      detail: 'Please enter your verification code',
      life: 3000
    });
    return;
  }

  isSubmitted.value = true;

  try {
    const { status, data: { message } } = await axios.post('auth/verify-email', {
      email: email.value,
      pin: verificationCode.value
    });

    if (status >= 200 && status < 300) {
      toast.add({
        severity: 'success',
        summary: 'Verification Successful',
        detail: 'Your email has been verified successfully',
        life: 3000
      });
      router.push('/sign-in');
    } else {
      toast.add({
        severity: 'error',
        summary: 'Verification Failed',
        detail: message || 'Verification failed',
        life: 3000
      });
      verificationCode.value = '';
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'An error occurred',
      life: 3000
    });
    verificationCode.value = '';
  } finally {
    isSubmitted.value = false;
  }
};

const resendVerificationCode = async () => {
  isResending.value = true;
  try {
    const { status, data } = await axios.post('auth/resend-email', {
      email: email.value,
      action: "verify"
    });

    if (status >= 200 && status < 300) {
      verificationCode.value = '';
    } else {
      toast.add({
        severity: 'error',
        summary: 'Resend Failed',
        detail: data.message || 'Failed to resend verification code',
        life: 3000
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'An error occurred while resending the code',
      life: 3000
    });
  } finally {
    isResending.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-secondary flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <!-- Registration Form -->
      <div v-if="!showPopUp" class="bg-secondary bg-opacity-80 shadow-xl rounded-xl p-8 space-y-6 backdrop-blur-sm">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-primary mb-2">Create account</h1>
          <p class="text-sm text-gray-800">Sign up for a new account</p>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <!-- Username Field -->
            <div>
              <label for="username" class="block text-sm font-medium text-black mb-2">
                Username
              </label>
              <InputText id="username" v-model="username" placeholder="Enter your username" class="w-full py-2 px-3 bg-secondary bg-opacity-70 rounded-lg text-white
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-400" :disabled="isSubmitted"
                required />
            </div>

            <!-- Name Field -->
            <div>
              <label for="name" class="block text-sm font-medium text-black mb-2">
                Name
              </label>
              <InputText id="name" v-model="name" placeholder="Enter your name" class="w-full py-2 px-3 bg-secondary bg-opacity-70 rounded-lg text-white
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-800" :disabled="isSubmitted"
                required />
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-black mb-2">
                Email
              </label>
              <InputText id="email" v-model="email" type="email" placeholder="Enter your email" class="w-full py-2 px-3 bg-secondary bg-opacity-70 rounded-lg text-white
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-800" :disabled="isSubmitted"
                required />
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div class="relative">
                <InputText id="password" :type="showPassword ? 'text' : 'password'" v-model="password"
                  placeholder="Enter your password" class="w-full py-2 px-3 bg-secondary bg-opacity-70 rounded-lg text-white
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-800" :disabled="isSubmitted"
                  required />
                <button type="button" @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none">
                  <!-- SVG icons -->
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

            <!-- Confirm Password Field -->
            <div>
              <label for="retypePassword" class="block text-sm font-medium text-black mb-2">
                Confirm Password
              </label>
              <div class="relative">
                <InputText id="retypePassword" :type="showRetypePassword ? 'text' : 'password'" v-model="retypePassword"
                  placeholder="Confirm your password" class="w-full py-2 px-3 bg-secondary bg-opacity-70 rounded-lg text-white
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-800" :disabled="isSubmitted"
                  required />
                <button type="button" @click="showRetypePassword = !showRetypePassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none">
                   <!-- SVG icons -->
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
              <p v-else-if="password && retypePassword && passwordsMatch" class="mt-2 text-green-400 text-sm">
                Passwords match
              </p>
            </div>
          </div>

          <Button type="submit" unstyled :disabled="isSubmitted || !passwordsMatch" class="w-full py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-lg
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-secondary
            disabled:opacity-70 disabled:cursor-not-allowed transition duration-200">
            {{ isSubmitted ? "Signing up..." : "Sign up" }}
          </Button>
        </form>

        <div class="text-center mt-4">
          <p class="text-sm text-gray-800">
            Already have an account?
            <RouterLink to="/sign-in"
              class="font-medium text-primary hover:text-primary/80 transition-colors duration-200">
              Sign in instead
            </RouterLink>
          </p>
        </div>
      </div>

      <!-- Verification Popup (Themed) -->
      <div v-else
        class="bg-secondary fixed inset-0 bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div class="bg-secondary bg-opacity-90 shadow-xl rounded-xl p-8 max-w-md w-full backdrop-blur-md border border-primary/20">
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-primary mb-2">Verify Your Email</h2>
            <p class="text-gray-800">We've sent a verification code to <span class="font-medium text-primary">{{ email }}</span></p>
          </div>

          <form @submit.prevent="handleVerifyEmail" class="space-y-6">
            <div class="flex flex-col items-center">
              <InputText v-model="verificationCode" type="text" inputmode="text" pattern="[0-9a-zA-Z]*" maxlength="8"
                placeholder="Enter verification code"
                class="w-full py-3 px-4 text-center text-lg bg-secondary bg-opacity-70 rounded-lg text-white
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                       placeholder-gray-400"
                autocomplete="one-time-code" autofocus />
              <p class="text-xs text-gray-600 mt-2">You can paste the code or type it</p>
            </div>

            <Button type="submit" unstyled
              class="w-full py-2 px-4 bg-primary hover:bg-primary/80 text-white rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-secondary
                     disabled:opacity-70 disabled:cursor-not-allowed transition duration-200"
              :disabled="!verificationCode || isSubmitted" :loading="isSubmitted">
              {{ isSubmitted ? "Verifying..." : "Verify Email" }}
            </Button>
          </form>

          <div class="mt-4 text-center text-sm text-gray-800">
            Didn't receive a code?
            <button @click="resendVerificationCode" class="font-medium text-primary hover:text-primary/80 disabled:opacity-70 disabled:cursor-not-allowed" :disabled="isResending">
              {{ isResending ? "Sending..." : "Resend Code" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
.backdrop-blur-md {
    backdrop-filter: blur(8px);
}
</style>
