<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import { ref } from 'vue';
import { useMobile } from '@/composables/screen';
import SideBar from './SideBar.vue';
import MenuBar from './MenuBar.vue';
import { memoryStorage } from '@/storage';
import router from '@/router';
import axios from 'axios';
import { Home, BarChart, Ticket, Warehouse, Car, Receipt, User, Inbox, Settings, LogOut } from 'lucide-vue-next';

const { isMobile } = useMobile();
const { role, username } = useAuth();

type MenuEntry = {
  label: string;
  icon?: any;
  url?: string;
  separator?: boolean;
  command?: Function;
};

const items = ref<MenuEntry[]>([
  { label: "Dashboard", icon: BarChart, url: "/dashboard" },
]);

if (role.value === "ADMIN" || role.value === "SECURITY") {
  items.value.push(
      { label: "Tickets", icon: Ticket, url: "/tickets" },
      { label: "Residences", icon: Home, url: "/residences" },
      { label: "Sections", icon: Warehouse, url: "/sections" },
      { label: "Vehicles", icon: Car, url: "/vehicles" },
  );
}

if (role.value === "ADMIN" || role.value === "USER") {
  items.value.push({ label: "Transactions", icon: Receipt, url: "/transactions" });
}

const userProfile: MenuEntry[] = [
  { label: username.value, icon: User, url: "#" },
  { label: '', separator: true },
  { label: "Inbox", icon: Inbox, url: "/inbox" },
  { label: "Settings", icon: Settings, url: "/settings" },
  {
    label: "Sign Out",
    icon: LogOut,
    url: "#",
    command: async () => {
      const { status } = await axios.get('auth/logout');
      if (status === 204) {
        memoryStorage.clearToken();
        await router.push('/sign-in');
      }
    },
  }
];
</script>

<template>
  <SideBar v-if="!isMobile" :items="items" :userProfile="userProfile">
    <slot />
  </SideBar>

  <MenuBar v-else :items="items" :userProfile="userProfile">
    <slot />
  </MenuBar>
</template>