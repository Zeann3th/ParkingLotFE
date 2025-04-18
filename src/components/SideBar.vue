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
  <div class="flex h-screen bg-secondary text-black">
    <!-- Sidebar -->
    <div class="relative w-64 bg-secondary border-r border-secondary shadow-md">
      <div class="h-full flex flex-col">
        <div class="p-4 border-b border-secondary">
          <RouterLink to="/" class="text-2xl font-bold text-primary pl-2">
            The Parking Hub
          </RouterLink>
        </div>

        <nav class="p-2 flex-1 overflow-y-auto">
          <ul>
            <li v-for="(item, index) in items" :key="index">
              <RouterLink v-if="item.url" :to="item.url"
                class="flex items-center p-3 hover:bg-primary hover:text-white rounded-lg transition-colors"
                active-class="bg-primary text-white">
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

        <div class="sticky bottom-0 p-4 border-t border-secondary bg-secondary">
          <div class="flex items-center relative">
            <img src="https://avatar.iran.liara.run/public" alt="User" class="w-10 h-10 rounded-full mr-3">
            <div>
              <p class="font-medium">{{ username }}</p>
              <p class="text-xs">{{ role }}</p>
            </div>
            <Button type="button" icon="pi pi-ellipsis-v" class="ml-auto text-black hover:text-black/80"
              @click="toggleMenu" unstyled />

            <Menu ref="menu" :model="userProfile" :popup="true"
              class="w-48 bg-secondary border border-secondary text-black shadow-md absolute top-[-12rem] right-0 mb-2">
              <template #item="{ item }">
                <RouterLink v-if="item.url" :to="item.url"
                  class="flex items-center p-2 hover:bg-gray-100 hover:text-black">
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
    <div class="flex-1 overflow-auto bg-secondary p-4">
      <slot />
    </div>
  </div>
</template>
