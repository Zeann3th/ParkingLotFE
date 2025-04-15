<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
defineProps({
  icon: {
    type: String,
    default: "+",
  }
});
defineEmits(['click']);
</script>

<template>
  <button class="floating-btn bg-green-600 hover:bg-green-700 text-white shadow-lg" @click="$emit('click')">
    {{ icon }}
  </button>
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
