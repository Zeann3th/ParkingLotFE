<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import MenuBar from '@/components/MenuBar.vue';
import Dialog from 'primevue/dialog';
import Avatar from 'primevue/avatar';
import Skeleton from 'primevue/skeleton';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import InputText from 'primevue/inputtext';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router';

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

const totalRecords = ref(0);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const searchQuery = ref('');

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
        query: searchQuery.value || undefined
      }
    });
    notifications.value = response.data.data;
    totalRecords.value = response.data.count;
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
  searchQuery.value = newQuery.query as string || '';
  fetchNotifications();
}, { immediate: true });

const updateRouteParams = () => {
  router.push({
    query: {
      page: currentPage.value,
      query: searchQuery.value || undefined
    }
  });
};

const onPageChange = (event: { page: number, rows: number }) => {
  currentPage.value = event.page + 1;
  rowsPerPage.value = event.rows;
  updateRouteParams();
};

const onSearch = () => {
  currentPage.value = 1;
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
    console.log('Selected Notification:', selectedNotification.value);
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
  <MenuBar />
  <div class="h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-4">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">Inbox</h1>
        <Button icon="pi pi-refresh" class="p-button-text" @click="fetchNotifications" />
      </div>

      <!-- Search Bar -->
      <div class="mb-6 flex items-center space-x-4">
        <div class="relative flex-1">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Search messages..." class="w-full" @keyup.enter="onSearch" />
          </span>
        </div>
        <Button label="Search" icon="pi pi-search" @click="onSearch" class="p-button-outlined" />
      </div>

      <!-- Skeleton Loading -->
      <div v-if="loading" class="space-y-2">
        <div v-for="(_, index) in skeletonItems" :key="index"
          class="bg-slate-800/50 rounded-lg p-4 flex items-start space-x-4">
          <Skeleton shape="circle" size="3rem"></Skeleton>
          <div class="flex-1">
            <div class="flex justify-between mb-2">
              <Skeleton width="30%" height="1.2rem"></Skeleton>
              <Skeleton width="20%" height="1rem"></Skeleton>
            </div>
            <Skeleton width="90%" height="1rem" class="mb-2"></Skeleton>
            <Skeleton width="75%" height="1rem"></Skeleton>
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-2">
        <div v-for="notification in notifications" :key="notification.id"
          class="bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 rounded-lg p-4 flex items-start space-x-4 cursor-pointer"
          @click="loadNotification(notification.id)">

          <!-- Avatar -->
          <Avatar :label="getInitials(notification.from.name)" class="flex-shrink-0"
            :style="{ backgroundColor: getAvatarColor(notification.from.id) }" />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex justify-between mb-1">
              <div class="font-medium">{{ notification.from.name }}</div>
              <div class="text-xs text-blue-200/70">{{ formatDate(notification.createdAt) }}</div>
            </div>
            <div class="text-xs text-blue-200/70 mb-1">{{ notification.from.username }}</div>
            <div class="text-sm text-blue-100/90 truncate">{{ truncateMessage(notification.message) }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && notifications.length === 0" class="text-center py-12">
        <i class="pi pi-inbox text-6xl text-blue-300/50 mb-4"></i>
        <p class="text-lg text-blue-200/70">Your inbox is empty</p>
      </div>

      <!-- Pagination -->
      <div v-if="totalRecords > 0" class="mt-6">
        <Paginator :rows="rowsPerPage" :totalRecords="totalRecords" :first="(currentPage - 1) * rowsPerPage"
          @page="onPageChange" :rowsPerPageOptions="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          class="bg-slate-800/50 border border-slate-700 rounded-lg" />
      </div>

      <!-- Notification Detail Dialog -->
      <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
        class="bg-slate-800 text-white border border-slate-700 rounded-lg" :style="{ width: '90%', maxWidth: '600px' }">
        <div v-if="selectedNotification" class="p-4">
          <div class="flex items-center space-x-3 mb-6">
            <Avatar :label="getInitials(selectedNotification.from.name)" class="flex-shrink-0" size="large"
              :style="{ backgroundColor: getAvatarColor(selectedNotification.from.id) }" />
            <div>
              <h2 class="text-xl font-bold">{{ selectedNotification.from.name }}</h2>
              <p class="text-sm text-blue-200/70">{{ selectedNotification.from.username }}</p>
            </div>
          </div>

          <div class="flex justify-between items-center mb-4">
            <p class="text-blue-200/90">{{ formatDate(selectedNotification.createdAt) }}</p>
          </div>

          <div class="border-t border-slate-700 pt-4 whitespace-pre-line">
            {{ selectedNotification.message }}
          </div>

          <div class="flex justify-end mt-6">
            <Button label="Close" @click="closeDialog" class="p-button-outlined" />
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-dialog-content) {
  background-color: rgba(30, 41, 59, 0.95);
  border-radius: 0.5rem;
  color: white;
}

:deep(.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

:deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.8);
}

:deep(.p-paginator) {
  background: transparent;
  border: none;
}

:deep(.p-paginator .p-paginator-page),
:deep(.p-paginator .p-paginator-next),
:deep(.p-paginator .p-paginator-last),
:deep(.p-paginator .p-paginator-first),
:deep(.p-paginator .p-paginator-prev),
:deep(.p-paginator .p-dropdown) {
  color: white;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: rgba(59, 130, 246, 0.5);
}

:deep(.p-inputtext) {
  background-color: rgba(30, 41, 59, 0.8);
  border-color: rgba(100, 116, 139, 0.5);
  color: white;
}

:deep(.p-inputtext:focus) {
  border-color: rgba(59, 130, 246, 0.8);
}

:deep(.p-dropdown-panel) {
  background-color: rgba(30, 41, 59, 0.95);
  border-color: rgba(100, 116, 139, 0.5);
  color: white;
}

:deep(.p-dropdown-item) {
  color: white;
}

:deep(.p-dropdown-item.p-highlight),
:deep(.p-dropdown-item:hover) {
  background-color: rgba(59, 130, 246, 0.3);
}
</style>
