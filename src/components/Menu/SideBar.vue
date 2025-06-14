<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/composables/auth';
import { RouterLink } from 'vue-router';
import Avatar from '@/components/Avatar.vue';

defineProps<{
  items: Array<{ label: string, icon?: any, url?: string }>,
  userProfile: Array<{ label?: string, icon?: any, url?: string, separator?: boolean, command?: Function }>
}>();

const { username, role, id } = useAuth();
const showProfileMenu = ref(false);

function handleProfileAction(item: any) {
  if (item.command) item.command();
  showProfileMenu.value = false;
}

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value;
}

// Close profile menu when clicking outside
function closeProfileMenu() {
  showProfileMenu.value = false;
}
</script>

<template>
  <div class="flex h-screen bg-white text-black">
    <!-- Sidebar -->
    <aside class="w-72 bg-gradient-to-b from-blue-50 to-white border-r border-blue-100 shadow-lg flex flex-col">
      <div class="px-6 py-6 border-b border-blue-100">
        <RouterLink to="/" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-white font-medium text-sm">P</span>
          </div>
          <span class="text-2xl font-bold text-blue-800">Parking Hub</span>
        </RouterLink>
      </div>
      <nav class="flex-1 px-4 py-6">
        <div v-for="item in items" :key="item.label" class="mb-1">
          <RouterLink
              v-if="item.url && item.url !== '#'"
              :to="item.url"
              class="flex items-center px-4 py-3 rounded-lg text-lg hover:bg-blue-50 mb-1 transition-colors"
              active-class="bg-blue-100 text-blue-700"
          >
            <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
            {{ item.label }}
          </RouterLink>
          <button
              v-else
              class="flex items-center px-4 py-3 rounded-lg text-lg hover:bg-blue-50 mb-1 transition-colors w-full text-left"
              @click="handleProfileAction(item)"
          >
            <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
            {{ item.label }}
          </button>
        </div>
      </nav>
      <div class="px-6 py-6 border-t border-blue-100 relative">
        <div class="flex items-center mb-4">
          <Avatar :name="username" :id="id" class="mr-3" />
          <div>
            <div class="font-semibold">{{ username }}</div>
            <div class="text-xs text-gray-500">{{ role }}</div>
          </div>
          <button
              @click="toggleProfileMenu"
              class="ml-auto p-2 rounded hover:bg-blue-100 transition-colors"
              aria-label="Profile options"
          >
            <span class="text-2xl">⋯</span>
          </button>
        </div>

        <!-- Backdrop for closing menu -->
        <div
            v-if="showProfileMenu"
            class="fixed inset-0 z-40"
            @click="closeProfileMenu"
        ></div>

        <!-- Profile Menu -->
        <div
            v-if="showProfileMenu"
            class="absolute right-6 bottom-16 w-56 bg-white border border-blue-100 rounded-lg shadow-lg z-50"
        >
          <div v-for="(item, index) in userProfile" :key="item.label || 'sep-' + index" class="mb-1">
            <hr v-if="item.separator" class="my-2 border-blue-100" />
            <RouterLink
                v-else-if="item.url && item.url !== '#'"
                :to="item.url"
                class="flex items-center w-full px-4 py-2 rounded-lg text-base hover:bg-blue-50 text-left transition-colors"
                @click="closeProfileMenu"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </RouterLink>
            <button
                v-else-if="item.label"
                class="flex items-center w-full px-4 py-2 rounded-lg text-base hover:bg-blue-50 text-left transition-colors"
                @click="handleProfileAction(item)"
            >
              <component v-if="item.icon" :is="item.icon" class="mr-3 w-5 h-5" />
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </aside>
    <!-- Main Content -->
    <main class="flex-1 overflow-auto bg-white p-8">
      <slot />
    </main>
  </div>
</template>