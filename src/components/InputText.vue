<script setup lang="ts">
import type { TicketType } from '@/types';
import { InputText } from 'primevue';
import { defineProps, defineEmits } from 'vue';

type AllowedTypes = string | TicketType | null | undefined;

defineProps<{
  modelValue: AllowedTypes;
  inputId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AllowedTypes]
}>();

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <InputText :value="modelValue" @input="updateValue" :id="inputId"
    class="w-full !focus:border-primary !focus:ring !focus:ring-primary !focus:ring-opacity-50 !bg-white !text-black !px-3 !py-2" />
</template>
