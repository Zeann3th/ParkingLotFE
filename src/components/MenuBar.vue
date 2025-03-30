<script setup lang="ts">
import { useAuth } from '@/composables/auth';
import router from '@/router';
import { memoryStorage } from '@/storage';
import axios from 'axios';
import { Menubar, Menu, Button } from 'primevue';
import { ref } from 'vue';

const { role, username } = useAuth();

const items = ref([
  {
    label: "Tickets",
    icon: "pi pi-fw pi-ticket",
    url: "/tickets",
  }
]);


if (role.value === "ADMIN" || role.value === "SECURITY") {
  items.value.push({
    label: "Sections",
    icon: "pi pi-fw pi-warehouse",
    url: "/sections",
  });
  items.value.push({
    label: "Vehicles",
    icon: "pi pi-fw pi-car",
    url: "/vehicles",
  })
  items.value.push({
    label: "Parking",
    icon: "pi pi-fw pi-stopwatch",
    url: "/parking",
  })
}

if (role.value === "ADMIN" || role.value === "USER") {
  items.value.push({
    label: "Transactions",
    icon: "pi pi-fw pi-receipt",
    url: "/transactions",
  })
}

if (role.value === "ADMIN") {
  items.value.push({
    label: "Roles",
    icon: "pi pi-fw pi-user-edit",
    url: "/roles",
  })
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

const toggle = (event: any) => {
  menu.value.toggle(event);
};

</script>

<template>
  <Menubar :model="items">
    <template #item="{ item }">
      <RouterLink v-if="item.url" :to="item.url">
        <div class="flex items-center space-x-2 m-2">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </div>
      </RouterLink>
    </template>

    <template #end>
      <div>
        <Button type="button" class="p-button-text p-button-rounded" @click="toggle" aria-controls="profile">
          <img src="https://avatar.iran.liara.run/public" alt="" width="40" height="40" class="rounded-full mr-2" />
        </Button>
        <Menu ref="menu" id="profile" :model="userProfile" :popup="true">
          <template #item="{ item }">
            <RouterLink v-if="item.url" :to="item.url">
              <div class="flex items-center space-x-2 m-2">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </div>
            </RouterLink>
          </template>
        </Menu>
      </div>
    </template>
  </Menubar>
</template>
