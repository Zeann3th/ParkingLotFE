<script setup lang="ts">
import Button from 'primevue/button';

defineProps({
  icon: {
    type: String,
    default: "+",
  }
});
defineEmits(['click']);
</script>

<template>
  <Button
    class="bg-primary text-white hover:bg-primary/80 fixed bottom-5 right-5 w-12 h-12 p-0 flex items-center justify-center rounded-full shadow-lg text-2xl"
    @click="$emit('click')" unstyled>
    {{ icon }}
  </Button>
</template>
