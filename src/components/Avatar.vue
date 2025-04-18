<script setup lang="ts">
import { getInitials, getRandomColor } from '@/utils';
import Avatar from 'primevue/avatar';
import { defineProps } from 'vue';

defineProps({
  name: {
    type: String,

    default: "User"
  },
  id: {
    type: Number,
    default: 0
  }
});
</script>

<template>
  <Avatar :label="getInitials(name)" class="flex-shrink-0 mr-2" size="large"
    :style="{ backgroundColor: getRandomColor(id), color: '#fff' }" />
</template>
