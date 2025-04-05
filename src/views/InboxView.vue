<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';

interface Notification {
  id: number;
  from: {
    id: number;
    username: string;
    name: string
  };
  message: string;
  status: string;
  createdAt: string;
}

interface Response {
  count: number;
  data: Notification[];
}

const notifications = ref<Notification[]>([]);
const selectedNotification = ref<Notification | null>(null);
const loading = ref<boolean>(true);
const toast = useToast();
const showDetailDialog = ref<boolean>(false);
const skeletonItems = Array(5).fill({});
const route = useRoute();
const router = useRouter();

const totalPages = ref(1);
const currentPage = ref(1);
const rowsPerPage = ref(10);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    const response = await axios.get<Response>('/notifications', {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
      params: {
        page: currentPage.value,
        limit: rowsPerPage.value,
      }
    });
    notifications.value = response.data.data;
    totalPages.value = response.data.count;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load notifications',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  fetchNotifications();
}, { immediate: true });

const updateRouteParams = () => {
  router.push({
    query: {
      page: currentPage.value,
    }
  });
};

const onPageChange = (event: { page: number }) => {
  currentPage.value = event.page + 1;
  updateRouteParams();
};

onMounted(() => {
  if (!route.query.page && !route.query.query) {
    updateRouteParams();
  }
});

const loadNotification = async (id: number) => {
  try {
    loading.value = true;
    const response = await axios.get<Notification>(`/notifications/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedNotification.value = response.data;
    showDetailDialog.value = true;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load notification details',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  showDetailDialog.value = false;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

const truncateMessage = (message: string, maxLength = 90) => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

const getInitials = (name: string) => {
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getAvatarColor = (userId: number) => {
  const colors = [
    '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC',
    '#81C784', '#AED581', '#DCE775', '#FFF176', '#FFD54F'
  ];
  return colors[userId % colors.length];
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-gray-900 p-4 md:p-6 text-gray-100">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-green-400">Inbox</h1>
          <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400"
            @click="fetchNotifications" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-3">
          <div v-for="(_, index) in skeletonItems" :key="index"
            class="bg-gray-800 bg-opacity-80 rounded-lg p-4 flex items-start space-x-4 shadow-sm backdrop-blur-sm">
            <Skeleton shape="circle" size="3rem" class="bg-gray-700"></Skeleton>
            <div class="flex-1">
              <div class="flex justify-between mb-2">
                <Skeleton width="30%" height="1.2rem" class="bg-gray-700"></Skeleton>
                <Skeleton width="20%" height="1rem" class="bg-gray-700"></Skeleton>
              </div>
              <Skeleton width="90%" height="1rem" class="mb-2 bg-gray-700"></Skeleton>
              <Skeleton width="75%" height="1rem" class="bg-gray-700"></Skeleton>
            </div>
          </div>
        </div>

        <!-- Notifications List -->
        <div v-else class="space-y-3">
          <div v-for="notification in notifications" :key="notification.id"
            class="bg-gray-800 bg-opacity-80 hover:bg-gray-700 hover:bg-opacity-90 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 cursor-pointer shadow-sm border border-gray-700 backdrop-blur-sm"
            @click="loadNotification(notification.id)">

            <!-- Avatar -->
            <Avatar :label="getInitials(notification.from.name)" class="flex-shrink-0"
              :style="{ backgroundColor: getAvatarColor(notification.from.id) }" />

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between mb-1">
                <div class="font-medium text-gray-100">{{ notification.from.name }}</div>
                <div class="text-xs text-gray-400">{{ formatDate(notification.createdAt) }}</div>
              </div>
              <div class="text-xs text-gray-400 mb-1">@{{ notification.from.username }}</div>
              <div class="text-sm text-gray-300">{{ truncateMessage(notification.message) }}</div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && notifications.length === 0"
          class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
          <i class="pi pi-inbox text-6xl text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-400">Your inbox is empty</p>
          <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
            @click="fetchNotifications" />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-6 flex justify-center">
          <Paginator :rows="1" :totalRecords="totalPages" :first="currentPage - 1" @page="onPageChange"
            :rowsPerPageOptions="[]" template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            class="bg-gray-800 bg-opacity-80 border border-gray-700 rounded-lg shadow-sm backdrop-blur-sm">
            <template #start>
              <span class="text-sm text-gray-400 mr-2">Page {{ currentPage }} of {{ totalPages }}</span>
            </template>
          </Paginator>
        </div>

        <!-- Notification Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
          class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
          :style="{ width: '90%', maxWidth: '600px' }">
          <div v-if="selectedNotification" class="p-4 md:p-6">
            <div class="flex items-center space-x-3 mb-6">
              <Avatar :label="getInitials(selectedNotification.from.name)" class="flex-shrink-0" size="large"
                :style="{ backgroundColor: getAvatarColor(selectedNotification.from.id) }" />
              <div>
                <h2 class="text-xl font-bold text-green-400">{{ selectedNotification.from.name }}</h2>
                <p class="text-sm text-gray-400">@{{ selectedNotification.from.username }}</p>
              </div>
            </div>

            <div class="flex justify-between items-center mb-4">
              <p class="text-gray-400">{{ formatDate(selectedNotification.createdAt) }}</p>
            </div>

            <div class="border-t border-gray-700 pt-4 whitespace-pre-line text-gray-300">
              {{ selectedNotification.message }}
            </div>

            <div class="flex justify-end mt-6">
              <Button label="Close" @click="closeDialog"
                class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  </MenuLayout>
</template>

<style scoped>
:deep(.p-dialog-content) {
  background-color: rgba(31, 41, 55, 0.9);
  border-radius: 0.5rem;
  color: #f3f4f6;
  border: 1px solid rgba(55, 65, 81, 0.8);
}

:deep(.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

:deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.7);
}

:deep(.p-paginator) {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.8);
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev) {
  color: #9ca3af;
  border: none;
  background: transparent;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: #10b981;
  color: white;
}

:deep(.p-paginator .p-paginator-page:not(.p-highlight):hover),
:deep(.p-paginator .p-paginator-next:hover),
:deep(.p-paginator .p-paginator-last:hover),
:deep(.p-paginator .p-paginator-first:hover),
:deep(.p-paginator .p-paginator-prev:hover) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

:deep(.p-inputtext) {
  background-color: rgba(31, 41, 55, 0.8);
  border-color: rgba(55, 65, 81, 0.8);
  color: #f3f4f6;
}

:deep(.p-inputtext:focus) {
  border-color: #10b981;
  box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.2);
}

:deep(.p-skeleton) {
  background-color: rgba(55, 65, 81, 0.5);
  background-image: linear-gradient(90deg,
      rgba(55, 65, 81, 0.5) 0%,
      rgba(75, 85, 99, 0.5) 50%,
      rgba(55, 65, 81, 0.5) 100%);
}
</style>
