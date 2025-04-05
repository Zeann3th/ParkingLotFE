<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import router from '@/router';
import { memoryStorage } from '@/storage';
import axios from 'axios';
import { Menu, Button } from 'primevue';
import { ref } from 'vue';
import { RouterLink } from 'vue-router';

const { role, username } = useAuth();

type MenuItem = {
  label: string;
  icon: string;
  url: string;
  badge?: string;
};

const menuItems = ref<MenuItem[]>([
  {
    label: "Dashboard",
    icon: "pi pi-fw pi-chart-bar",
    url: "/dashboard",
  },
  {
    label: "Tickets",
    icon: "pi pi-fw pi-ticket",
    url: "/tickets",
  }
]);

if (role.value === "ADMIN" || role.value === "SECURITY") {
  menuItems.value.push({
    label: "Sections",
    icon: "pi pi-fw pi-warehouse",
    url: "/sections",
  });
  menuItems.value.push({
    label: "Vehicles",
    icon: "pi pi-fw pi-car",
    url: "/vehicles",
  });
  menuItems.value.push({
    label: "Parking",
    icon: "pi pi-fw pi-stopwatch",
    url: "/parking",
  });
}

if (role.value === "ADMIN" || role.value === "USER") {
  menuItems.value.push({
    label: "Transactions",
    icon: "pi pi-fw pi-receipt",
    url: "/transactions",
  });
}

if (role.value === "ADMIN") {
  menuItems.value.push({
    label: "Users",
    icon: "pi pi-fw pi-user-edit",
    url: "/users",
  });
}

const userProfile = ref([
  {
    label: username.value,
    icon: "pi pi-fw pi-user",
    url: "#"
  },
  {
    separator: true
  },
  {
    label: "Inbox",
    icon: "pi pi-fw pi-inbox",
    url: "/inbox",
  },
  {
    label: "Settings",
    icon: "pi pi-fw pi-cog",
    url: "/settings",
  },
  {
    label: "Sign Out",
    icon: "pi pi-fw pi-sign-out",
    url: "#",
    command: async () => {
      const { status } = await axios.get('auth/logout');
      if (status === 204) {
        memoryStorage.clearToken();
        router.push('/sign-in');
      }
    }
  }
]);

const menu = ref();

const toggleMenu = (event: Event) => {
  menu.value.toggle(event);
};
</script>

<template>
  <div class="flex h-screen bg-gray-900">
    <!-- Sidebar Container (relative positioning for dropdown) -->
    <div class="relative w-64 bg-gray-800 border-r border-gray-700">
      <!-- Sidebar Content -->
      <div class="h-full flex flex-col">
        <div class="p-4 border-b border-gray-700">
          <RouterLink to="/"
            class="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            The Parking<span class="text-white">Hub</span>
          </RouterLink>
        </div>

        <nav class="p-2 flex-1 overflow-y-auto">
          <ul>
            <li v-for="(item, index) in menuItems" :key="index">
              <RouterLink :to="item.url"
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

        <!-- User Profile Section (absolute bottom) -->
        <div class="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <div class="flex items-center relative">
            <img src="https://avatar.iran.liara.run/public" alt="User" class="w-10 h-10 rounded-full mr-3">
            <div>
              <p class="font-medium text-gray-300">{{ username }}</p>
              <p class="text-xs text-gray-500">Administrator</p>
            </div>
            <Button type="button" icon="pi pi-ellipsis-v"
              class="p-button-text p-button-rounded ml-auto text-gray-400 hover:text-green-400" @click="toggleMenu" />

            <!-- Menu positioned relative to the sidebar container -->
            <Menu ref="menu" :model="userProfile" :popup="true"
              class="w-48 bg-gray-800 border border-gray-700 absolute bottom-full right-0 mb-2">
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

    <!-- Main Content Area -->
    <div class="flex-1 overflow-auto bg-gray-900">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.p-menu {
  background: rgb(31 41 55 / 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(55 65 81);
  z-index: 50;
}

.p-menu .p-menuitem-link:hover {
  background: rgb(55 65 81 / 0.5);
}

.p-menu .p-menuitem-link:focus {
  box-shadow: none;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.bottom-full {
  bottom: 100%;
}

.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
