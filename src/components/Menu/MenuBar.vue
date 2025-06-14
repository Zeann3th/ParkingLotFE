<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import Avatar from '@/components/Avatar.vue';
import { useAuth } from '@/composables/auth';

defineProps<{
  items: Array<{ label: string, icon?: any, url?: string }>,
  userProfile: Array<{ label?: string, icon?: any, url?: string, separator?: boolean, command?: Function }>
}>();

const { username, id } = useAuth();
const drawerOpen = ref(false);

function handleProfileAction(item: any) {
  if (item.command) item.command();
  drawerOpen.value = false;
}

function handleNavigation() {
  drawerOpen.value = false;
}

function closeDrawer() {
  drawerOpen.value = false;
}
</script>

<template>
  <div class="bg-white min-h-screen flex flex-col">
    <nav class="w-full border-b bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-4 py-3">
      <button @click="drawerOpen = true" class="p-2 rounded hover:bg-blue-50">
        <span class="pi pi-bars text-2xl text-blue-700"></span>
      </button>
      <RouterLink to="/" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
          <span class="text-white font-medium text-sm">P</span>
        </div>
        <span class="text-xl font-medium text-gray-900">Parking Hub</span>
      </RouterLink>
      <Avatar :name="username" :id="id" class="w-8 h-8" />
    </nav>

    <!-- Drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-50 bg-black/40" @click="closeDrawer">
      <div class="fixed left-0 top-0 h-full w-64 bg-white shadow-lg p-6 flex flex-col" @click.stop>
        <div class="flex items-center mb-6">
          <Avatar :name="username" :id="id" class="mr-3" />
          <div>
            <div class="font-semibold">{{ username }}</div>
          </div>
        </div>
        <nav class="flex-1">
          <div v-for="item in items" :key="item.label" class="mb-1">
            <RouterLink
                v-if="item.url && item.url !== '#'"
                :to="item.url"
                class="flex items-center px-3 py-3 rounded-lg text-lg hover:bg-blue-50 mb-1 transition-colors"
                active-class="bg-blue-100 text-blue-700"
                @click="handleNavigation"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </RouterLink>
            <button
                v-else
                class="flex items-center px-3 py-3 rounded-lg text-lg hover:bg-blue-50 mb-1 w-full text-left transition-colors"
                @click="handleProfileAction(item)"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </button>
          </div>
        </nav>
        <div class="mt-6 border-t pt-4">
          <div
              v-for="(item, index) in userProfile"
              :key="item.label || 'sep-' + index"
              class="mb-1"
          >
            <hr v-if="item.separator" class="my-2 border-gray-200" />
            <RouterLink
                v-else-if="item.url && item.url !== '#'"
                :to="item.url"
                class="flex items-center w-full px-3 py-2 rounded-lg text-base hover:bg-blue-50 text-left transition-colors"
                @click="handleNavigation"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </RouterLink>
            <button
                v-else-if="item.label"
                class="flex items-center w-full px-3 py-2 rounded-lg text-base hover:bg-blue-50 text-left transition-colors"
                @click="handleProfileAction(item)"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <main class="flex-1 p-4 bg-white">
      <slot />
    </main>
  </div>
</template>