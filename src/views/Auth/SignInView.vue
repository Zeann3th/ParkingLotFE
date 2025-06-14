<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'vue-sonner';
import { memoryStorage } from '@/storage';
import PasswordField from '@/components/Auth/PasswordField.vue';

const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const isSubmitted = ref(false);

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
      await router.push(redirectPath as string);
    } else {
      toast.error('Login Failed', {
        description: message || 'Sign in failed',
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
            <RouterLink to="/sign-up">
              <button class="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-200 shadow-lg">
                Sign Up
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Sign In Section -->
    <div class="flex items-center justify-center px-6 py-16">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="text-center mb-12">
          <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
            <span class="text-sm text-blue-700 font-medium">Welcome Back</span>
          </div>

          <h1 class="text-4xl font-light text-gray-900 mb-4">
            Sign <span class="font-medium bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">In</span>
          </h1>

          <p class="text-lg text-gray-600 leading-relaxed">
            Access your parking dashboard
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
            </div>

            <Button
                type="submit"
                :disabled="isSubmitted"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:bg-blue-400 transition-all duration-200"
            >
              {{ isSubmitted ? "Signing in..." : "Sign In" }}
            </Button>
          </form>

          <!-- Additional Options -->
          <div class="mt-6 pt-6 border-t border-gray-100">
            <div class="text-center">
              <a href="#" class="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                Forgot your password?
              </a>
            </div>
          </div>
        </div>

        <!-- Footer Link -->
        <div class="text-center mt-8">
          <p class="text-gray-600">
            Don't have an account?
            <RouterLink
                to="/sign-up"
                class="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 ml-1"
            >
              Sign up now
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