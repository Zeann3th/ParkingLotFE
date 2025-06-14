<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'vue-sonner';
import { memoryStorage } from '@/storage';
import PasswordField from './PasswordField.vue';
import VerificationModal from './VerificationModal.vue';

interface Props {
  mode: 'signin' | 'signup';
}

const props = defineProps<Props>();
const router = useRouter();
const route = useRoute();

// Form fields
const username = ref('');
const password = ref('');
const name = ref('');
const email = ref('');
const retypePassword = ref('');
const isSubmitted = ref(false);

// Verification state
const showVerificationModal = ref(false);
const verificationCode = ref('');
const isResending = ref(false);

// Computed properties
const isSignUp = computed(() => props.mode === 'signup');
const passwordError = ref('');

const passwordsMatch = computed(() => {
  if (!isSignUp.value) return true;
  return password.value === retypePassword.value;
});

// Validation
const validateForm = () => {
  passwordError.value = '';

  if (isSignUp.value && password.value !== retypePassword.value) {
    passwordError.value = 'Passwords do not match';
    return false;
  }

  return true;
};

// Form submission
const handleSubmit = async (event: Event) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  isSubmitted.value = true;

  try {
    if (isSignUp.value) {
      await handleSignUp();
    } else {
      await handleSignIn();
    }
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'An error occurred',
    });
  } finally {
    isSubmitted.value = false;
  }
};

const handleSignIn = async () => {
  const { status, data: { access_token, message } } = await axios.post('auth/login', {
    username: username.value,
    password: password.value
  });

  if (status >= 200 && status < 300) {
    memoryStorage.setToken(access_token);
    const redirectPath = route.query.redirect || '/dashboard';
    router.push(redirectPath as string);
  } else {
    toast.error('Login Failed', {
      description: message || 'Sign in failed',
    });
  }
};

const handleSignUp = async () => {
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
};

// Email verification
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
      router.push('/sign-in');
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
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
    <form @submit="handleSubmit" class="space-y-6">
      <div class="space-y-6">
        <!-- Username Field -->
        <div class="space-y-2">
          <Label for="username">
            Username
          </Label>
          <Input
              id="username"
              v-model="username"
              placeholder="Enter your username"
              :disabled="isSubmitted"
              required
          />
        </div>

        <!-- Name Field (Sign Up Only) -->
        <div v-if="isSignUp" class="space-y-2">
          <Label for="name">
            Full Name
          </Label>
          <Input
              id="name"
              v-model="name"
              placeholder="Enter your full name"
              :disabled="isSubmitted"
              required
          />
        </div>

        <!-- Email Field (Sign Up Only) -->
        <div v-if="isSignUp" class="space-y-2">
          <Label for="email">
            Email Address
          </Label>
          <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email address"
              :disabled="isSubmitted"
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
            required
        />

        <!-- Confirm Password Field (Sign Up Only) -->
        <div v-if="isSignUp">
          <PasswordField
              id="retypePassword"
              v-model="retypePassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              :disabled="isSubmitted"
              required
          />

          <!-- Password Match Indicator -->
          <div v-if="password && retypePassword" class="mt-2">
            <p v-if="passwordError" class="text-sm text-destructive">
              {{ passwordError }}
            </p>
            <p v-else-if="passwordsMatch" class="text-sm text-green-600">
              ✓ Passwords match
            </p>
            <p v-else class="text-sm text-destructive">
              ✗ Passwords do not match
            </p>
          </div>
        </div>
      </div>

      <Button
          type="submit"
          :disabled="isSubmitted || (isSignUp && !passwordsMatch)"
          class="w-full"
      >
        {{ isSubmitted ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In") }}
      </Button>
    </form>

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