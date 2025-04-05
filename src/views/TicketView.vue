<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue';
import MenuBar from '@/components/MenuBar.vue';
import { useAuth } from '@/composables/auth';
import axios from 'axios';
import { memoryStorage } from '@/storage';
import Skeleton from 'primevue/skeleton';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { useToast } from 'primevue';
import { useRoute, useRouter } from 'vue-router';

interface Ticket {
  id: number;
  title: string;
  type: "DAILY" | "MONTHLY" | "RESERVED";
  status: "AVAILABLE" | "INUSE" | "LOST";
  vehicleId?: number;
  userId?: number;
}

interface Response {
  count: number;
  data: Ticket[];
}

const { role } = useAuth();
const tickets: Ref<Ticket[]> = ref([]);
const selectedTicket = ref<Ticket | null>(null);
const loading = ref(true);
const detailsLoading = ref(false);
const showDetailDialog = ref<boolean>(false);
const toast = useToast();
const route = useRoute();
const router = useRouter();

const totalPages = ref(1);
const currentPage = ref(1);
const rowsPerPage = ref(10);

const fetchTickets = async () => {
  loading.value = true;
  try {
    const response = await axios.get<Response>(
      '/tickets',
      {
        headers: {
          Authorization: `Bearer ${memoryStorage.getToken()}`,
        },
        params: {
          page: currentPage.value,
          limit: rowsPerPage.value,
        }
      }
    );
    tickets.value = response.data.data;
    totalPages.value = response.data.count;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load tickets',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  fetchTickets();
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

const fetchTicketDetails = async (id: number) => {
  detailsLoading.value = true;
  showDetailDialog.value = true;

  try {
    const response = await axios.get<Ticket>(`/tickets/${id}`, {
      headers: {
        Authorization: `Bearer ${memoryStorage.getToken()}`,
      },
    });
    selectedTicket.value = response.data;
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load ticket details',
      life: 3000,
    });
  } finally {
    detailsLoading.value = false;
  }
};

const closeDialog = () => {
  showDetailDialog.value = false;
};

onMounted(() => {
  if (!route.query.page) {
    updateRouteParams();
  }
});

const isAdmin = computed(() => role.value === 'ADMIN');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'text-green-400';
    case 'INUSE':
      return 'text-blue-400';
    case 'LOST':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const getStatusBgColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-900 bg-opacity-30';
    case 'INUSE':
      return 'bg-blue-900 bg-opacity-30';
    case 'LOST':
      return 'bg-red-900 bg-opacity-30';
    default:
      return 'bg-gray-900 bg-opacity-30';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'DAILY':
      return 'Daily Pass';
    case 'MONTHLY':
      return 'Monthly Subscription';
    case 'RESERVED':
      return 'Reserved Spot';
    default:
      return type;
  }
};
</script>

<template>
  <MenuBar />
  <div class="min-h-screen bg-gray-900 p-4 md:p-6 text-gray-100">
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl md:text-3xl font-bold text-green-400">Tickets</h1>
        <Button icon="pi pi-refresh" class="p-button-text text-gray-400 hover:text-green-400" @click="fetchTickets" />
      </div>

      <!-- Skeleton Loading -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="n in 8" :key="n" class="bg-gray-800 bg-opacity-80 rounded-lg shadow p-4 backdrop-blur-sm">
          <Skeleton width="60%" height="1.5rem" class="mb-2 bg-gray-700" />
          <div class="flex space-x-6">
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
            <Skeleton width="30%" height="1rem" class="mb-1 bg-gray-700" />
          </div>
        </div>
      </div>

      <!-- Tickets Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div v-for="ticket in tickets" :key="ticket.id"
          class="bg-gray-800 bg-opacity-80 hover:bg-gray-700 hover:bg-opacity-90 transition-all duration-200 rounded-lg shadow-sm p-4 cursor-pointer border border-gray-700 backdrop-blur-sm"
          @click="fetchTicketDetails(ticket.id)">
          <div class="flex justify-between items-start mb-2">
            <h2 class="text-lg font-semibold text-gray-100 line-clamp-1">{{ ticket.title }}</h2>
            <span class="text-xs px-2 py-1 rounded-full"
              :class="[getStatusColor(ticket.status), getStatusBgColor(ticket.status)]">
              {{ ticket.status }}
            </span>
          </div>
          <div class="text-sm text-gray-400 mb-1">Type: {{ getTypeLabel(ticket.type) }}</div>
          <div class="text-xs text-gray-500 mt-2">ID: {{ ticket.id }}</div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && tickets.length === 0"
        class="text-center py-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-sm backdrop-blur-sm">
        <i class="pi pi-ticket text-6xl text-gray-600 mb-4"></i>
        <p class="text-lg text-gray-400">No tickets found</p>
        <Button label="Refresh" icon="pi pi-refresh" class="mt-4 bg-green-600 hover:bg-green-700 border-green-600"
          @click="fetchTickets" />
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

      <!-- Ticket Detail Dialog -->
      <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
        class="bg-gray-800 bg-opacity-90 text-gray-100 border border-gray-700 rounded-lg shadow-lg backdrop-blur-sm"
        :style="{ width: '90%', maxWidth: '600px' }">
        <div v-if="selectedTicket && !detailsLoading" class="p-4 md:p-6">
          <div class="mb-6">
            <h2 class="text-xl font-bold border-b border-gray-700 pb-2 text-green-400">Ticket Details</h2>
          </div>

          <div class="space-y-4">
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">ID</span>
              <span class="font-medium text-gray-100">{{ selectedTicket.id }}</span>
            </div>

            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">Title</span>
              <span class="font-medium text-gray-100">{{ selectedTicket.title }}</span>
            </div>

            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">Type</span>
              <span class="font-medium text-gray-100">{{ getTypeLabel(selectedTicket.type) }}</span>
            </div>

            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">Status</span>
              <span class="font-medium" :class="getStatusColor(selectedTicket.status)">{{ selectedTicket.status
                }}</span>
            </div>

            <div v-if="selectedTicket.vehicleId" class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">Vehicle ID</span>
              <span class="font-medium text-gray-100">{{ selectedTicket.vehicleId }}</span>
            </div>

            <div v-if="selectedTicket.userId" class="flex flex-col space-y-1">
              <span class="text-sm text-gray-400">User ID</span>
              <span class="font-medium text-gray-100">{{ selectedTicket.userId }}</span>
            </div>
          </div>

          <div class="flex justify-end mt-6 space-x-3">
            <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil"
              class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
            <Button label="Close" @click="closeDialog"
              class="p-button-outlined text-gray-300 hover:text-gray-100 border-gray-600 hover:border-gray-500" />
          </div>
        </div>

        <!-- Loading state in dialog -->
        <div v-if="detailsLoading" class="p-4 space-y-4">
          <Skeleton width="60%" height="2rem" class="mb-6 bg-gray-700" />
          <Skeleton width="100%" height="1.5rem" class="mb-2 bg-gray-700" />
          <Skeleton width="80%" height="1.5rem" class="mb-2 bg-gray-700" />
          <Skeleton width="90%" height="1.5rem" class="mb-2 bg-gray-700" />
          <Skeleton width="70%" height="1.5rem" class="mb-2 bg-gray-700" />
          <div class="flex justify-end mt-6">
            <Skeleton width="100px" height="2.5rem" class="bg-gray-700" />
          </div>
        </div>
      </Dialog>
    </div>
  </div>

  <button v-if="isAdmin" class="floating-btn bg-green-600 hover:bg-green-700 text-white shadow-lg">
    +
  </button>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.2s ease;
}

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

:deep(.p-button.p-button-text) {
  color: #9ca3af;
}

:deep(.p-button.p-button-text:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #10b981;
}

:deep(.p-skeleton) {
  background-color: rgba(55, 65, 81, 0.5);
  background-image: linear-gradient(90deg,
      rgba(55, 65, 81, 0.5) 0%,
      rgba(75, 85, 99, 0.5) 50%,
      rgba(55, 65, 81, 0.5) 100%);
}
</style>
