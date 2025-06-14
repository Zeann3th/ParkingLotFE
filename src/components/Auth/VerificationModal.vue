<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, X } from 'lucide-vue-next';

interface Props {
  email: string;
  verificationCode: string;
  isSubmitting: boolean;
  isResending: boolean;
  open?: boolean;
}

withDefaults(defineProps<Props>(), {
  open: true,
});

const emit = defineEmits<{
  verify: [];
  resend: [];
  'update:verification-code': [value: string];
  'update:open': [value: boolean];
  close: [];
}>();

const updateVerificationCode = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:verification-code', target.value);
};

const handleVerify = (event: Event) => {
  event.preventDefault();
  emit('verify');
};

const handleClose = () => {
  emit('update:open', false);
  emit('close');
};
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-md">
      <!-- Close Button -->
      <Button
          variant="ghost"
          size="icon"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          @click="handleClose"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </Button>

      <!-- Header -->
      <DialogHeader class="text-center space-y-4">
        <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Mail class="h-8 w-8 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <DialogTitle class="text-2xl font-medium">
            Verify Your Email
          </DialogTitle>
          <DialogDescription class="text-base">
            We've sent a verification code to
            <span class="font-medium text-foreground">{{ email }}</span>
          </DialogDescription>
        </div>
      </DialogHeader>

      <!-- Verification Form -->
      <form @submit="handleVerify" class="space-y-6 mt-6">
        <div class="space-y-2">
          <Label for="verification-code" class="text-sm font-medium">
            Verification Code
          </Label>
          <Input
              id="verification-code"
              :value="verificationCode"
              type="text"
              inputmode="text"
              pattern="[0-9a-zA-Z]*"
              maxlength="8"
              placeholder="Enter verification code"
              class="text-center tracking-wider"
              autocomplete="one-time-code"
              autofocus
              @input="updateVerificationCode"
          />
          <p class="text-xs text-muted-foreground text-center">
            You can paste the code or type it manually
          </p>
        </div>

        <Button
            type="submit"
            :disabled="!verificationCode || isSubmitting"
            class="w-full"
        >
          {{ isSubmitting ? "Verifying..." : "Verify Email" }}
        </Button>
      </form>

      <!-- Resend Code -->
      <div class="mt-6 text-center space-y-2">
        <p class="text-sm text-muted-foreground">Didn't receive a code?</p>
        <Button
            variant="link"
            :disabled="isResending"
            @click="$emit('resend')"
            class="p-0 h-auto text-sm font-medium"
        >
          {{ isResending ? "Sending..." : "Resend Code" }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>