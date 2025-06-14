<script setup lang="ts">
import { computed } from 'vue'
import type { TicketType } from '@/types'

type AllowedTypes = string | TicketType | null | undefined

const props = defineProps<{
  modelValue: AllowedTypes
  inputId: string
  class?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AllowedTypes]
}>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const mergedClass = computed(() => [
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500',
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 font-medium',
  props.class
].filter(Boolean).join(' '))
</script>

<template>
  <input
      :id="inputId"
      type="text"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :class="mergedClass"
      @input="updateValue"
  />
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

* {
  font-family: 'Inter', sans-serif;
}
</style>
