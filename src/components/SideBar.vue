<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/auth';
import { Menu, Button } from 'primevue';
import { RouterLink } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';

defineProps<{
  items: MenuItem[],
  userProfile: MenuItem[]
}>();

const menu = ref();
const toggleMenu = (event: Event) => menu.value.toggle(event);
const { username, role } = useAuth();
</script>

<template>
  <div class="flex h-screen bg-gray-900">
    <!-- Sidebar -->
    <div class="relative w-64 bg-gray-800 border-r border-gray-700">
      <div class="h-full flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <RouterLink to="/"
            class="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            The Parking<span class="text-white">Hub</span>
          </RouterLink>
        </div>

        <nav class="p-2 flex-1 overflow-y-auto">
          <ul>
            <li v-for="(item, index) in items" :key="index">
              <RouterLink v-if="item.url" :to="item.url"
                class="flex items-center p-3 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                active-class="bg-gray-700 text-green-400">
                <span :class="item.icon" class="mr-3"></span>
                <span>{{ item.label }}</span>
                <span v-if="item.badge"
                  class="ml-auto bg-green-900 text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ item.badge }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="sticky bottom-0 p-4 border-t border-gray-700 bg-gray-800">
          <div class="flex items-center relative">
            <img src="https://avatar.iran.liara.run/public" alt="User" class="w-10 h-10 rounded-full mr-3">
            <div>
              <p class="font-medium text-gray-300">{{ username }}</p>
              <p class="text-xs text-gray-500">{{ role }}</p>
            </div>
            <Button type="button" icon="pi pi-ellipsis-v"
              class="p-button-text p-button-rounded ml-auto text-gray-400 hover:text-green-400" @click="toggleMenu" />

            <Menu ref="menu" :model="userProfile" :popup="true"
              class="w-48 bg-gray-800 border border-gray-700 absolute top-[-12rem] right-0 mb-2">
              <template #item="{ item }">
                <RouterLink v-if="item.url" :to="item.url"
                  class="flex items-center p-2 text-gray-300 hover:bg-gray-700">
                  <span :class="item.icon" class="mr-2"></span>
                  <span>{{ item.label }}</span>
                </RouterLink>
              </template>
            </Menu>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-auto bg-gray-900 p-4">
      <slot />
    </div>
  </div>
</template>
