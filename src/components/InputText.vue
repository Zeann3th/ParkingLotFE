<script setup lang="ts">
import type { TicketType } from '@/types';
import { InputText } from 'primevue';
import { computed } from 'vue';

type AllowedTypes = string | TicketType | null | undefined;

const props = defineProps<{
  modelValue: AllowedTypes;
  inputId: string;
  class?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AllowedTypes]
}>();

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const mergedClass = computed(() => [
  'w-full !focus:border-primary !focus:ring !focus:ring-primary !focus:ring-opacity-50 !bg-white !text-black !px-3 !py-2',
  props.class
])
</script>

<template>
  <InputText :value="modelValue" @input="updateValue" :id="inputId" :class="mergedClass" />
</template>
