<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { useAuth } from '@/composables/auth'

const { email } = useAuth()

const pin = ref('')
const showForm = ref(false)
const isRequesting = ref(false)
const isResetting = ref(false)
const form = ref({ newPassword: '', confirmPassword: '' })

const sendResetEmail = async () => {
  isRequesting.value = true
  try {
    await axios.post('auth/forgot-password', { email: email.value })
    toast.success('Check your inbox for the PIN.')
    showForm.value = true
    pin.value = ''
    form.value = { newPassword: '', confirmPassword: '' }
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Reset email failed.')
  } finally {
    isRequesting.value = false
  }
}

const resetPassword = async () => {
  if (!pin.value || pin.value.length !== 8) {
    toast.warning('PIN must be 8 characters.')
    return
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    toast.warning('Passwords do not match.')
    return
  }
  isResetting.value = true
  try {
    await axios.post('auth/reset-password', {
      email: email.value,
      pin: pin.value,
      password: form.value.newPassword
    })
    toast.success('Password has been reset.')
    showForm.value = false
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Reset failed.')
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-lg mx-auto space-y-10 animate-fadeInUp">
    <!-- Account Section -->
    <section>
      <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Account Credentials</h2>
      <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">
        Request password reset to be sent to <strong class="text-blue-600 dark:text-blue-400">{{ email }}</strong>
      </p>

      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button :disabled="isRequesting || showForm" class="mt-4 w-full">Send Reset Instructions</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <h3 class="text-lg font-medium">Are you sure?</h3>
          <p>This will send reset instructions to your email.</p>
          <div class="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction @click="sendResetEmail">Send</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </section>

    <!-- Reset Form Section -->
    <section v-if="showForm" class="transition-all duration-300">
      <h2 class="text-xl font-medium text-gray-900 dark:text-white mb-4">Reset Your Password</h2>
      <div class="space-y-4">
        <Input v-model="pin" placeholder="Enter PIN" class="tracking-widest text-lg" />
        <Input v-model="form.newPassword" type="password" placeholder="New Password" />
        <Input v-model="form.confirmPassword" type="password" placeholder="Confirm Password" />
        <Button
            @click="resetPassword"
            :disabled="isResetting || !pin || !form.newPassword || form.newPassword !== form.confirmPassword"
            class="w-full"
        >
          Reset Password
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.5s ease-out both;
}
</style>
