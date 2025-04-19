<script setup lang="ts">
import { InputNumber } from 'primevue';
import { defineProps, defineEmits } from 'vue';

defineProps<{
  modelValue: number | null | undefined;
  inputId: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number | null | undefined]
}>();

const updateValue = (value: number | null | undefined) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <InputNumber :value="modelValue" @update:modelValue="updateValue" :inputId="inputId" class="w-full" inputClass="
      !focus:border-primary !focus:ring !focus:ring-primary !focus:ring-opacity-50
      !bg-white !text-black !px-3 !py-2" />
</template>
