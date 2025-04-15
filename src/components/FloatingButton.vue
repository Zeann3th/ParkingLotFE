<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { Button } from 'primevue';
defineProps({
  icon: {
    type: String,
    default: "+",
  }
});
defineEmits(['click']);
</script>

<template>
  <Button class="floating-btn shadow-lg" @click="$emit('click')">
    {{ icon }}
  </Button>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;
}
</style>
