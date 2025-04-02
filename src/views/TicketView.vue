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
import InputText from 'primevue/inputtext';
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

// Pagination
const totalRecords = ref(0);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const searchQuery = ref('');

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
          query: searchQuery.value || undefined
        }
      }
    );
    tickets.value = response.data.data;
    totalRecords.value = response.data.count;
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
  searchQuery.value = newQuery.query as string || '';
  fetchTickets();
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
  if (!route.query.page && !route.query.query) {
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
  <div class="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white">
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-3xl font-bold">Tickets</h1>
        <Button icon="pi pi-refresh" class="p-button-text" @click="fetchTickets" />
      </div>
      
      <!-- Search and Filter -->
      <div class="mb-6 flex items-center space-x-4">
        <div class="relative flex-1">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Search tickets..." class="w-full"
              @keyup.enter="onSearch" />
          </span>
        </div>
        <Button label="Search" icon="pi pi-search" @click="onSearch" />
      </div>
      
      <!-- Skeleton Loading -->
      <div v-if="loading" class="space-y-2">
        <div v-for="n in 5" :key="n" class="bg-slate-800/50 rounded-lg p-4">
          <Skeleton width="60%" height="1.5rem" class="mb-2" />
          <div class="flex space-x-6">
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="30%" height="1rem" class="mb-1" />
          </div>
        </div>
      </div>
      
      <!-- Tickets List -->
      <div v-else class="space-y-2">
        <div v-for="ticket in tickets" :key="ticket.id"
          class="bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200 rounded-lg p-4 cursor-pointer"
          @click="fetchTicketDetails(ticket.id)">
          <h2 class="text-lg font-semibold">{{ ticket.title }}</h2>
          <div class="flex items-center space-x-6 mt-2">
            <div class="text-sm text-blue-200/70">Type: {{ getTypeLabel(ticket.type) }}</div>
            <div class="text-sm" :class="getStatusColor(ticket.status)">Status: {{ ticket.status }}</div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="!loading && tickets.length === 0" class="text-center py-12">
        <i class="pi pi-ticket text-6xl text-blue-300/50 mb-4"></i>
        <p class="text-lg text-blue-200/70">No tickets found</p>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalRecords > 0" class="mt-6">
        <Paginator 
          :rows="rowsPerPage"
          :totalRecords="totalRecords"
          :first="(currentPage - 1) * rowsPerPage"
          @page="onPageChange"
          :rowsPerPageOptions="[10, 20, 50]"
          template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          class="bg-slate-800/50 border border-slate-700 rounded-lg"
        />
      </div>
      
      <!-- Ticket Detail Dialog -->
      <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false"
        class="bg-slate-800 text-white border border-slate-700 rounded-lg" :style="{ width: '90%', maxWidth: '600px' }">
        <div v-if="selectedTicket && !detailsLoading" class="p-4">
          <div class="mb-6">
            <h2 class="text-xl font-bold border-b border-slate-700 pb-2">Ticket Details</h2>
          </div>
          
          <div class="space-y-4">
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">ID</span>
              <span class="font-medium">{{ selectedTicket.id }}</span>
            </div>
            
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">Title</span>
              <span class="font-medium">{{ selectedTicket.title }}</span>
            </div>
            
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">Type</span>
              <span class="font-medium">{{ getTypeLabel(selectedTicket.type) }}</span>
            </div>
            
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">Status</span>
              <span class="font-medium" :class="getStatusColor(selectedTicket.status)">{{ selectedTicket.status }}</span>
            </div>
            
            <div v-if="selectedTicket.vehicleId" class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">Vehicle ID</span>
              <span class="font-medium">{{ selectedTicket.vehicleId }}</span>
            </div>
            
            <div v-if="selectedTicket.userId" class="flex flex-col space-y-1">
              <span class="text-sm text-blue-200/70">User ID</span>
              <span class="font-medium">{{ selectedTicket.userId }}</span>
            </div>
          </div>
          
          <div class="flex justify-end mt-6 space-x-3">
            <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil" class="p-button-outlined p-button-info" />
            <Button label="Close" @click="closeDialog" class="p-button-outlined" />
          </div>
        </div>
        
        <!-- Loading state in dialog -->
        <div v-if="detailsLoading" class="p-4 space-y-4">
          <Skeleton width="60%" height="2rem" class="mb-6" />
          <Skeleton width="100%" height="1.5rem" class="mb-2" />
          <Skeleton width="80%" height="1.5rem" class="mb-2" />
          <Skeleton width="90%" height="1.5rem" class="mb-2" />
          <Skeleton width="70%" height="1.5rem" class="mb-2" />
          <div class="flex justify-end mt-6">
            <Skeleton width="100px" height="2.5rem" />
          </div>
        </div>
      </Dialog>
    </div>
  </div>
  
  <button v-if="isAdmin" class="floating-btn bg-green-500 hover:bg-green-600 text-white">
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
}

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
