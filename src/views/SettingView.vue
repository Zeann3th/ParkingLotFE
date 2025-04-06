<script setup lang="ts">
import { ref } from 'vue';
import { InputText, Button, useToast, useConfirm, ConfirmPopup } from "primevue";
import axios from 'axios';
import MenuLayout from '@/components/MenuLayout.vue';
import { useAuth } from '@/composables/auth';

const toast = useToast();
const confirm = useConfirm();

const { email } = useAuth();
const pin = ref('');
const form = ref({
  newPassword: '',
  confirmPassword: ''
});

// States
const showVerificationPopup = ref(false);
const showPasswordForm = ref(false);
const isResending = ref(false);
const isSubmitting = ref(false);
const isVerifying = ref(false);

const requestPasswordResetDirectly = async () => {
  try {
    isSubmitting.value = true;
    await axios.post('auth/forgot-password', { email: email.value });
    showVerificationPopup.value = true;
    toast.add({
      severity: 'success',
      summary: 'Email Sent',
      detail: 'Password reset instructions sent to your email',
      life: 3000
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to send reset instructions',
      life: 3000
    });
  } finally {
    isSubmitting.value = false;
  }
};

const requestPasswordReset = () => {
  confirm.require({
    message: 'Are you sure you want to reset your password?',
    header: 'Reset Password',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: requestPasswordResetDirectly,
    reject: () => {
      // Do nothing on reject
    }
  });
};

const resendVerificationCode = async () => {
  isResending.value = true;
  try {
    await axios.post('auth/resend-email', {
      email: email.value,
      action: "reset"
    });
    toast.add({
      severity: 'success',
      summary: 'Email Resent',
      detail: 'Password reset instructions sent again to your email',
      life: 3000
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to resend instructions',
      life: 3000
    });
  } finally {
    isResending.value = false;
  }
};

const verifyPin = async () => {
  isVerifying.value = true;
  try {
    showVerificationPopup.value = false;
    showPasswordForm.value = true;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Invalid PIN',
      life: 3000
    });
  } finally {
    isVerifying.value = false;
  }
};

const handlePasswordReset = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Passwords do not match',
      life: 3000
    });
    return;
  }

  if (form.value.newPassword.length < 8) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Password must be at least 8 characters',
      life: 3000
    });
    return;
  }

  isSubmitting.value = true;
  try {
    await axios.post('auth/reset-password', {
      email: email.value,
      pin: pin.value,
      password: form.value.newPassword
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password reset successfully. You can now sign in with your new password.',
      life: 3000
    });

    pin.value = '';
    form.value = {
      newPassword: '',
      confirmPassword: ''
    };
    showPasswordForm.value = false;
    showVerificationPopup.value = false;
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to reset password',
      life: 3000
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <MenuLayout>
    <!-- Themes -->
    <h2 class="text-xl font-bold mb-4">Theme Settings</h2>

    <!-- Credentials -->
    <h2 class="text-xl font-bold mb-4">Account Credentials</h2>
    <div v-if="!showVerificationPopup && !showPasswordForm">
      <ConfirmPopup />
      <!-- Initial Email Form - Left aligned -->
      <div class="space-y-4 max-w-md ml-0">
        <Button type="button" @click="requestPasswordReset" label="Send Reset PIN" :loading="isSubmitting"
          class="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" />
      </div>
    </div>

    <!-- PIN Verification Popup -->
    <div v-else-if="showVerificationPopup"
      class="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Verify Your Identity</h2>
          <p class="text-gray-600 dark:text-gray-300">We've sent an 8-character PIN to <span
              class="font-semibold text-gray-800 dark:text-white">{{ email }}</span></p>
        </div>

        <form @submit.prevent="verifyPin" class="space-y-6">
          <div class="flex flex-col items-center">
            <InputText v-model="pin" type="text" inputmode="text" pattern="[0-9a-zA-Z]*" maxlength="8"
              placeholder="Enter verification code"
              class="w-full py-3 px-4 text-center text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700"
              autocomplete="one-time-code" autofocus />
            <p class="text-xs text-gray-400 mt-2">You can paste the code or type it</p>
          </div>

          <Button type="submit" label="Verify PIN" :disabled="!pin || pin.length < 8 || isVerifying"
            :loading="isVerifying"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200" />
        </form>

        <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Didn't receive a PIN?
          <button @click="resendVerificationCode"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            :disabled="isResending">
            {{ isResending ? "Sending..." : "Resend PIN" }}
          </button>
        </div>
      </div>
    </div>

    <!-- New Password Form -->
    <div v-else-if="showPasswordForm"
      class="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 max-w-md w-full">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Create New Password</h2>
          <p class="text-gray-600 dark:text-gray-300">Please enter and confirm your new password</p>
        </div>

        <form @submit.prevent="handlePasswordReset" class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <InputText v-model="form.newPassword" type="password" placeholder="Enter new password" required
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" />
            <p class="text-xs text-gray-500 dark:text-gray-400">Minimum 8 characters</p>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <InputText v-model="form.confirmPassword" type="password" placeholder="Confirm new password" required
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700" />
          </div>

          <Button type="submit" label="Reset Password" :loading="isSubmitting"
            :disabled="!form.newPassword || !form.confirmPassword || form.newPassword !== form.confirmPassword"
            class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" />
        </form>
      </div>
    </div>
  </MenuLayout>
</template>
