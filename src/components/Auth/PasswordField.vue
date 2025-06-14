<script setup lang="ts">
import { ref } from 'vue';
import {Input} from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-vue-next';

interface Props {
  id: string;
  label: string;
  placeholder: string;
  modelValue: string;
  disabled?: boolean;
  required?: boolean;
}

withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showPassword = ref(false);

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="space-y-2">
    <Label :for="id" class="text-sm font-medium text-gray-700">
      {{ label }}
    </Label>
    <div class="relative">
      <Input
          :id="id"
          :type="showPassword ? 'text' : 'password'"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          @input="updateValue"
          class="pr-12"
      />
      <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="showPassword = !showPassword"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
      >
        <Eye v-if="!showPassword" class="h-4 w-4 text-gray-400 hover:text-gray-600" />
        <EyeOff v-else class="h-4 w-4 text-gray-400 hover:text-gray-600" />
        <span class="sr-only">
          {{ showPassword ? 'Hide password' : 'Show password' }}
        </span>
      </Button>
    </div>
  </div>
</template>