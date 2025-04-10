<script setup lang="ts">
import { ref, computed } from 'vue';
import { InputText, Button, useToast, useConfirm, ConfirmDialog } from "primevue";
import axios from 'axios';
import MenuLayout from '@/components/MenuLayout.vue';
import { useAuth } from '@/composables/auth';
import { useTheme } from '@/composables/theme';

const toast = useToast();
const confirm = useConfirm();

const { email } = useAuth();
const { theme, toggleTheme } = useTheme();

const pin = ref('');
const form = ref({
  newPassword: '',
  confirmPassword: ''
});
const showPasswordForm = ref(false);
const isSubmittingRequest = ref(false);
const isSubmittingReset = ref(false);

const themeButtonIcon = computed(() => theme.value === 'light' ? 'pi pi-moon' : 'pi pi-sun');
const themeButtonLabel = computed(() => theme.value === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');

const requestAndShowPasswordForm = async () => {
  isSubmittingRequest.value = true;
  try {
    await axios.post('auth/forgot-password', { email: email.value });

    showPasswordForm.value = true;
    pin.value = '';
    form.value = { newPassword: '', confirmPassword: '' };
    toast.add({
      severity: 'success',
      summary: 'Check Your Email',
      detail: 'Password reset instructions (including a PIN) sent to your email. Enter the PIN below along with your new password.',
      life: 5000
    });
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to send reset instructions',
      life: 3000
    });
  } finally {
    isSubmittingRequest.value = false;
  }
};

const confirmPasswordResetRequest = (event: Event) => {
  confirm.require({
    target: event.currentTarget as HTMLElement,
    message: 'Are you sure? This will send password reset instructions and a PIN to your email.',
    header: 'Confirm Request',
    icon: 'pi pi-envelope',
    acceptClass: 'p-button-primary',
    rejectClass: 'p-button-text',
    acceptLabel: 'Yes, Send Instructions',
    rejectLabel: 'Cancel',
    accept: requestAndShowPasswordForm,
    reject: () => { }
  });
};


const handlePasswordReset = async () => {
  if (!pin.value || pin.value.length !== 8) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please enter the 8-character PIN from your email.', life: 3000 });
    return;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Passwords do not match', life: 3000 });
    return;
  }
  if (form.value.newPassword.length < 8) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Password must be at least 8 characters', life: 3000 });
    return;
  }

  isSubmittingReset.value = true;
  try {
    await axios.post('auth/reset-password', {
      email: email.value,
      pin: pin.value,
      password: form.value.newPassword
    });

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Password reset successfully!',
      life: 4000
    });

    pin.value = '';
    form.value = { newPassword: '', confirmPassword: '' };
    showPasswordForm.value = false;

  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Failed to reset password. Please check your PIN or try again.',
      life: 4000
    });
  } finally {
    isSubmittingReset.value = false;
  }
};
</script>

<template>
  <MenuLayout>
    <div class="p-4 md:p-6 space-y-8">

      <!-- Theme Settings Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Theme Settings</h2>
        <div
          class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-md">
          <div class="flex items-center justify-between">
            <span class="text-gray-700 dark:text-gray-300">Appearance</span>
            <Button :label="themeButtonLabel" :icon="themeButtonIcon" @click="toggleTheme"
              class="p-button-outlined p-button-sm" />
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Currently in {{ theme }} mode.
          </p>
        </div>
      </section>

      <!-- Account Credentials Section -->
      <section>
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Account Credentials</h2>
        <div
          class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-md space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Request password reset instructions (including a PIN) to be sent to your registered email address: <strong
              class="text-gray-800 dark:text-white break-all">{{ email }}</strong>.
          </p>
          <ConfirmDialog />
          <Button type="button" @click="confirmPasswordResetRequest" label="Send Reset Instructions" icon="pi pi-send"
            :loading="isSubmittingRequest" :disabled="showPasswordForm" class="w-full md:w-auto" />
          <p v-if="showPasswordForm" class="text-sm text-green-600 dark:text-green-400 font-medium">
            Instructions sent! Please check your email and fill out the form below.
          </p>
        </div>
      </section>


      <!-- Reset Password Form  -->
      <section v-if="showPasswordForm" class="password-reset-section animate-fade-in">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Reset Your Password</h2>
        <div class="modal-container max-w-md p-6 sm:p-8">

          <form @submit.prevent="handlePasswordReset" class="space-y-5">
            <div>
              <label for="reset-pin" class="label-themed mb-2">Verification PIN</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-key" />
                <InputText id="reset-pin" v-model="pin" type="text" inputmode="text" pattern="[0-9a-zA-Z]*"
                  maxlength="8" required placeholder="Enter 8-character PIN from email"
                  class="input-themed w-full !text-lg tracking-widest" autocomplete="one-time-code" />
              </span>
            </div>
            <div>
              <label for="new-password" class="label-themed mb-2">New Password</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-lock" />
                <InputText id="new-password" v-model="form.newPassword" type="password" placeholder="Enter new password"
                  required class="input-themed w-full" />
              </span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label for="confirm-password" class="label-themed mb-2">Confirm Password</label>
              <span class="p-input-icon-left w-full">
                <i class="pi pi-lock-open" />
                <InputText id="confirm-password" v-model="form.confirmPassword" type="password"
                  placeholder="Confirm new password" required class="input-themed w-full" />
              </span>
            </div>

            <Button type="submit" label="Reset Password & Verify PIN" :loading="isSubmittingReset"
              :disabled="!pin || pin.length < 8 || !form.newPassword || form.newPassword.length < 8 || !form.confirmPassword || form.newPassword !== form.confirmPassword"
              class="w-full py-3 button-primary-themed" />
          </form>
          <Button label="Cancel" icon="pi pi-times"
            @click="showPasswordForm = false; pin = ''; form = { newPassword: '', confirmPassword: '' };"
            class="p-button-text p-button-sm mt-4 w-full" />
        </div>
      </section>
    </div>
  </MenuLayout>
</template>


<style scoped>
:root {
  --text-color: #1f2937;
  --text-color-secondary: #6b7280;
  --surface-ground: #f3f4f6;
  --surface-card: #ffffff;
  --surface-border: #e5e7eb;
  --surface-section: #ffffff;
  --primary-color: #2563eb;
  --primary-color-hover: #1d4ed8;
  --primary-color-text: #ffffff;
  --link-color: #2563eb;
  --link-color-hover: #1e40af;
}

html.dark {
  --text-color: #f3f4f6;
  --text-color-secondary: #9ca3af;
  --surface-ground: #111827;
  --surface-card: #1f2937;
  --surface-border: #374151;
  --surface-section: #374151;
  --primary-color: #3b82f6;
  --primary-color-hover: #2563eb;
  --primary-color-text: #ffffff;
  --link-color: #60a5fa;
  --link-color-hover: #93c5fd;
}

.label-themed {
  display: block;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: color 0.3s;
}

:deep(.input-themed.p-inputtext) {
  background-color: var(--surface-section);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  border-radius: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  transition: background-color 0.3s, border-color 0.3s, color 0.3s, box-shadow 0.2s;
}

:deep(.p-input-icon-left > .input-themed.p-inputtext) {
  padding-left: 2.75rem;
}

:deep(.p-input-icon-left > i) {
  color: var(--text-color-secondary);
  left: 1rem;
  top: 50%;
  margin-top: -0.5rem;
}

:deep(.input-themed.p-inputtext:focus) {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

:deep(.input-themed.p-inputtext::placeholder) {
  color: var(--text-color-secondary);
  opacity: 0.7;
}

:deep(.button-primary-themed.p-button) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--primary-color-text);
  font-weight: 500;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
}

:deep(.button-primary-themed.p-button:hover:not(.p-disabled)) {
  background-color: var(--primary-color-hover);
  border-color: var(--primary-color-hover);
}

:deep(.button-primary-themed.p-button:focus) {
  outline: none;
  box-shadow: 0 0 0 2px var(--surface-card), 0 0 0 4px var(--primary-color);
}

:deep(.button-primary-themed.p-button:active:not(.p-disabled)) {
  transform: scale(0.98);
}

/* Theme for outline button used for theme toggle */
:deep(.p-button-outlined) {
  color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

:deep(.p-button-outlined:hover) {
  background: rgba(var(--primary-color), 0.05) !important;
  /* Needs tweaking if using hex */
}

/* Link Styling */
.link-themed {
  color: var(--link-color);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.link-themed:hover {
  color: var(--link-color-hover);
  text-decoration: underline;
}

.link-themed:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  text-decoration: none;
}

.link-themed:disabled:hover {
  color: var(--link-color);
}

/* Modal-like container for the password form */
.modal-container {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s, border-color 0.3s;
}

html.dark .modal-container {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.15);
}


:deep(.p-confirm-popup) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

html.dark :deep(.p-confirm-popup) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

:deep(.p-confirm-popup .p-confirm-popup-content) {
  padding: 1.5rem;
}

:deep(.p-confirm-popup .p-confirm-popup-icon) {
  color: var(--text-color-secondary);
  margin-right: 0.75rem;
}

:deep(.p-confirm-popup .p-confirm-popup-message) {
  line-height: 1.6;
  margin-left: 0.5rem;
}

:deep(.p-confirm-popup .p-confirm-popup-footer) {
  padding: 0 1.5rem 1.5rem 1.5rem;
  text-align: right;
  border-top: none;
}

:deep(.p-confirm-popup .p-confirm-popup-footer button) {
  margin-left: 0.5rem;
}

:deep(.p-confirm-popup .p-button-text) {
  color: var(--text-color-secondary);
}

:deep(.p-confirm-popup .p-button-text:hover) {
  background-color: var(--surface-hover) !important;
  color: var(--text-color) !important;
}

/* Fade-in Animation for the Form */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.4s ease-out forwards;
}
</style>
