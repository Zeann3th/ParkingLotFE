<script setup lang="ts">
import { ref } from 'vue';
import { Menu, Menubar, Button } from 'primevue';
import { RouterLink } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';

defineProps<{
  items: MenuItem[],
  userProfile: MenuItem[]
}>();

const menu = ref();
const toggle = (event: Event) => menu.value.toggle(event);
</script>

<template>
  <div class="bg-secondary dark:bg-primary min-h-screen flex flex-col">
    <Menubar :model="items">
      <template #item="{ item }">
        <RouterLink v-if="item.url" :to="item.url">
          <div class="flex items-center space-x-2 m-2 text-secondary hover:text-secondary/80">
            <span :class="item.icon" />
            <span>{{ item.label }}</span>
          </div>
        </RouterLink>
      </template>

      <template #end>
        <Button type="button" class="p-button-text p-button-rounded" @click="toggle" aria-controls="profile">
          <img src="https://avatar.iran.liara.run/public" alt="User" width="40" height="40" class="rounded-full mr-2" />
        </Button>
        <Menu ref="menu" id="profile" :model="userProfile" :popup="true">
          <template #item="{ item }">
            <RouterLink v-if="item.url" :to="item.url">
              <div class="flex items-center space-x-2 m-2  text-secondary  hover:text-secondary/80">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </div>
            </RouterLink>
          </template>
        </Menu>
      </template>
    </Menubar>

    <!-- Main content -->
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>
