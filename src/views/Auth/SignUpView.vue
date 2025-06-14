<script setup lang="ts">
import axios from 'axios';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'vue-sonner';
import PasswordField from '@/components/Auth/PasswordField.vue';
import VerificationModal from '@/components/Auth/VerificationModal.vue';

const router = useRouter();

const username = ref('');
const password = ref('');
const name = ref('');
const email = ref('');
const retypePassword = ref('');
const isSubmitted = ref(false);
const passwordError = ref('');

const showVerificationModal = ref(false);
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
      toast.success('Registration Successful', {
        description: 'Please check your email for verification code',
      });
      showVerificationModal.value = true;
    } else {
      toast.error('Registration Failed', {
        description: data.message || 'Sign up failed',
      });
    }
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'An error occurred',
    });
  } finally {
    isSubmitted.value = false;
  }
}

const handleVerifyEmail = async () => {
  if (!verificationCode.value) {
    toast.error('Verification Failed', {
      description: 'Please enter your verification code',
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
      toast.success('Verification Successful', {
        description: 'Your email has been verified successfully',
      });
      await router.push('/sign-in');
    } else {
      toast.error('Verification Failed', {
        description: message || 'Verification failed',
      });
      verificationCode.value = '';
    }
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'An error occurred',
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
      toast.success('Code Sent', {
        description: 'Verification code has been resent',
      });
    } else {
      toast.error('Resend Failed', {
        description: data.message || 'Failed to resend verification code',
      });
    }
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'An error occurred while resending the code',
    });
  } finally {
    isResending.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex justify-between items-center">
          <RouterLink to="/" class="group flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-200 shadow-lg">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-xl font-medium text-gray-900">Parking Hub</span>
          </RouterLink>

          <div class="flex items-center space-x-4">
            <RouterLink to="/sign-in">
              <button class="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                Sign In
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Sign Up Section -->
    <div class="flex items-center justify-center px-6 py-16">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
            <span class="text-sm text-blue-700 font-medium">Join Us</span>
          </div>

          <h1 class="text-4xl font-light text-gray-900 mb-4">
            Create <span class="font-medium bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">Account</span>
          </h1>

          <p class="text-lg text-gray-600 leading-relaxed">
            Start managing your parking spaces
          </p>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-2xl shadow-xl border border-blue-100/50 p-8 backdrop-blur-sm">
          <form @submit="handleSubmit" class="space-y-6">
            <div class="space-y-6">
              <!-- Username Field -->
              <div class="space-y-2">
                <Label for="username" class="text-gray-700 font-medium">
                  Username
                </Label>
                <Input
                    id="username"
                    v-model="username"
                    placeholder="Enter your username"
                    :disabled="isSubmitted"
                    class="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                />
              </div>

              <!-- Name Field -->
              <div class="space-y-2">
                <Label for="name" class="text-gray-700 font-medium">
                  Full Name
                </Label>
                <Input
                    id="name"
                    v-model="name"
                    placeholder="Enter your full name"
                    :disabled="isSubmitted"
                    class="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                />
              </div>

              <!-- Email Field -->
              <div class="space-y-2">
                <Label for="email" class="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                    id="email"
                    v-model="email"
                    type="email"
                    placeholder="Enter your email address"
                    :disabled="isSubmitted"
                    class="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                />
              </div>

              <!-- Password Field -->
              <PasswordField
                  id="password"
                  v-model="password"
                  label="Password"
                  placeholder="Enter your password"
                  :disabled="isSubmitted"
                  class="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  required
              />

              <!-- Confirm Password Field -->
              <div class="space-y-2">
                <PasswordField
                    id="retypePassword"
                    v-model="retypePassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    :disabled="isSubmitted"
                    class="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    required
                />

                <!-- Password Match Indicator -->
                <div v-if="password && retypePassword" class="mt-3">
                  <p v-if="passwordError" class="text-red-500 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {{ passwordError }}
                  </p>
                  <p v-else-if="passwordsMatch" class="text-green-600 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Passwords match
                  </p>
                  <p v-else class="text-red-500 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Passwords do not match
                  </p>
                </div>
              </div>
            </div>

            <Button
                type="submit"
                :disabled="isSubmitted || !passwordsMatch"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:bg-blue-400 transition-all duration-200"
            >
              {{ isSubmitted ? "Creating account..." : "Create Account" }}
            </Button>
          </form>
        </div>

        <!-- Footer Link -->
        <div class="text-center mt-8">
          <p class="text-gray-600">
            Already have an account?
            <RouterLink
                to="/sign-in"
                class="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 ml-1"
            >
              Sign in instead
            </RouterLink>
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-100 py-12 mt-16">
      <div class="max-w-6xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-3 mb-4 md:mb-0">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <span class="text-white font-medium text-sm">P</span>
            </div>
            <span class="text-lg font-medium text-gray-900">Parking Hub</span>
          </div>

          <div class="flex space-x-8 mb-4 md:mb-0">
            <RouterLink to="/#about" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">About</RouterLink>
            <RouterLink to="/#features" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">Features</RouterLink>
            <RouterLink to="/#pricing" class="text-gray-600 hover:text-blue-600 transition-colors duration-200">Pricing</RouterLink>
          </div>

          <p class="text-sm text-gray-500">
            © {{ new Date().getFullYear() }} Parking Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

    <!-- Verification Modal -->
    <VerificationModal
        v-if="showVerificationModal"
        :email="email"
        :verification-code="verificationCode"
        :is-submitting="isSubmitted"
        :is-resending="isResending"
        @verify="handleVerifyEmail"
        @resend="resendVerificationCode"
        @update:verification-code="verificationCode = $event"
        @close="showVerificationModal = false"
    />
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

input:focus {
  outline: none;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}
</style>