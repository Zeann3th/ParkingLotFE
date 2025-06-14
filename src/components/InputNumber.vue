<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number | null | undefined
  inputId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null | undefined]
}>()

const internalValue = ref<number | null | undefined>(props.modelValue)

watch(() => props.modelValue, (val) => {
  internalValue.value = val
})

const updateValue = (val: number | null) => {
  internalValue.value = val
  emit('update:modelValue', val)
}

const increment = () => {
  if (internalValue.value === null || internalValue.value === undefined) {
    updateValue(1)
  } else {
    updateValue(internalValue.value + 1)
  }
}

const decrement = () => {
  if (internalValue.value === null || internalValue.value === undefined) {
    updateValue(0)
  } else {
    updateValue(internalValue.value - 1)
  }
}
</script>

<template>
  <div class="flex items-center space-x-2 w-full">
    <button
        @click="decrement"
        class="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
        type="button"
    >
      −
    </button>

    <input
        :id="inputId"
        type="number"
        :value="internalValue ?? ''"
        @input="updateValue(($event.target as HTMLInputElement).valueAsNumber || null)"
        class="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 font-medium"
        placeholder="Enter number"
    />

    <button
        @click="increment"
        class="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
        type="button"
    >
      +
    </button>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

* {
  font-family: 'Inter', sans-serif;
}
</style>
