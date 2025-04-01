<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import MenuBar from '@/components/MenuBar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import { memoryStorage } from '@/storage';
import { useToast } from 'primevue';

interface Notification {
  id: number;
  from: number;
  to: number;
  message: string;
  status: string;
  created_at: string;
}

const notifications = ref<Notification[]>([]);
const selectedNotification = ref<Notification | null>(null);
const loading = ref<boolean>(true);
const toast = useToast();

const skeletonItems = Array(10).fill({});

onMounted(async () => {
  try {
    const response = await axios.get<Notification[]>('/notifications', {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    notifications.value = response.data;
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
});

const loadNotification = async (id: number) => {
  try {
    const response = await axios.get<Notification>(`/notifications/${id}`);
    selectedNotification.value = response.data;
  } catch (error) {
    console.error('Failed to load notification', error);
  }
};
</script>

<template>
  <MenuBar />
  <div class="flex h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
    <div class="w-1/3 p-4 border-r border-white/10">
      <h2 class="text-xl font-bold mb-4">Inbox</h2>

      <DataTable v-if="!loading" :value="notifications" selectionMode="single"
        @rowSelect="(e: any) => loadNotification(e.data.id)" class="border-none">
        <Column field="from" header="From" />
        <Column field="message" header="Message Preview">
          <template #body="{ data }">
            <span class="truncate block max-w-xs">{{ data.message }}</span>
          </template>
        </Column>
        <Column field="created_at" header="Received" />
      </DataTable>

      <div v-else class="space-y-2">
        <div v-for="(_, index) in skeletonItems" :key="index" class="p-4 border-b border-white/10">
          <div class="flex items-center space-x-3">
            <Skeleton width="3rem" height="2rem" class="mb-2"></Skeleton>
            <div class="flex-1">
              <Skeleton width="100%" height="1rem" class="mb-2"></Skeleton>
              <Skeleton width="80%" height="1rem"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-2/3 p-6" v-if="selectedNotification">
      <Card>
        <template #content>
          <h2 class="text-2xl font-bold">Message from {{ selectedNotification.from }}</h2>
          <p class="text-sm text-blue-200/80">{{ selectedNotification.created_at }}</p>
          <p class="mt-4">{{ selectedNotification.message }}</p>
        </template>
      </Card>
    </div>
  </div>
</template>

<style>
.p-datatable .p-datatable-tbody>tr:hover {
  background: rgba(255, 255, 255, 0.1) !important;
}
</style>
