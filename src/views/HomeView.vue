<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import { Menubar } from 'primevue';
import { ref } from 'vue';

const items = ref([
  {
    label: "Inbox",
    icon: "pi pi-fw pi-inbox",
  },
  {
    label: "Tickets",
    icon: "pi pi-fw pi-ticket",
  }
]);

const { role } = useAuth();

if (role.value === "ADMIN" || role.value === "SECURITY") {
  items.value.push({
    label: "Sections",
    icon: "pi pi-fw pi-warehouse",
  });
}

</script>

<template>
  <Menubar :model="items" />
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <!-- History -->
    <div id="w-1/2"></div>
    <!-- Forms -->
    <div id="w-1/2"></div>
  </div>
</template>
