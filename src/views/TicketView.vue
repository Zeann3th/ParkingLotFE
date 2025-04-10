<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue';
import { useAuth } from '@/composables/auth';
import { Skeleton, Dialog, Button, Paginator, useToast } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Ticket } from '@/types';
import { ticketService } from '@/services/ticket.service';
import { usePagination } from '@/composables/pagination';

const { isLoading, isMutated, totalPages, currentPage, rowsPerPage, updateRouteParams, onPageChange,
  closeDialog, showDetailDialog } = usePagination();

const { role } = useAuth();
const tickets: Ref<Ticket[]> = ref([]);
const selectedTicket = ref<Ticket | null>(null);
const detailsLoading = ref(false);
const toast = useToast();
const route = useRoute();

const getAllTickets = async () => {
  isLoading.value = true;
  try {
    const response = await ticketService.getAll(currentPage.value, rowsPerPage.value, { cache: isMutated.value });
    tickets.value = response.data;
    totalPages.value = response.count;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tickets', life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  currentPage.value = parseInt(newQuery.page as string) || 1;
  getAllTickets();
}, { immediate: true });

const getTicketDetail = async (id: number) => {
  detailsLoading.value = true;
  showDetailDialog.value = true;

  try {
    const response = await ticketService.getById(id);
    selectedTicket.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ticket details', life: 3000, });
    showDetailDialog.value = false;
  } finally {
    detailsLoading.value = false;
  }
};

onMounted(() => {
  if (!route.query.page) {
    updateRouteParams();
  }
});

const isAdmin = computed(() => role.value === 'ADMIN');

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300';
    case 'INUSE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
    case 'LOST':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const getStatusTextClass = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'text-green-600 dark:text-green-400';
    case 'INUSE': return 'text-blue-600 dark:text-blue-400';
    case 'LOST': return 'text-red-600 dark:text-red-400';
    default: return 'text-gray-600 dark:text-gray-400';
  }
}

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
  <MenuLayout>
    <div
      class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">Tickets</h1>
          <Button icon="pi pi-refresh"
            class="p-button-text text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
            @click="getAllTickets" aria-label="Refresh Tickets" />
        </div>

        <!-- Skeleton Loading -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="`skel-${n}`" class="card-themed-skeleton p-4">
            <Skeleton width="60%" height="1.5rem" class="mb-2" />
            <div class="flex justify-between">
              <Skeleton width="40%" height="1rem" class="mb-1" />
              <Skeleton width="30%" height="1rem" class="mb-1 rounded-full" />
            </div>
            <Skeleton width="30%" height="0.8rem" class="mt-2" />
          </div>
        </div>

        <!-- Tickets Grid -->
        <div v-else-if="tickets.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="ticket in tickets" :key="ticket.id"
            class="card-themed p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-gray-800/40"
            @click="getTicketDetail(ticket.id)" role="button" :aria-label="`View details for ticket ${ticket.title}`">
            <div class="flex justify-between items-start mb-2 gap-2">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 break-all"
                :title="ticket.title">
                {{ ticket.title }}
              </h2>
              <span class="text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                :class="getStatusBadgeClass(ticket.status)">
                {{ ticket.status }}
              </span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Type: {{ getTypeLabel(ticket.type) }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-500 mt-2">ID: {{ ticket.id }}</div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else
          class="text-center py-16 bg-white dark:bg-gray-800/50 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50">
          <i class="pi pi-ticket text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <p class="text-lg text-gray-500 dark:text-gray-400 mb-6">No tickets found</p>
          <Button label="Refresh" icon="pi pi-refresh"
            class="bg-green-600 hover:bg-green-700 border-green-600 text-white px-5 py-2.5" @click="getAllTickets" />
        </div>

        <!-- Pagination -->
        <div v-if="!isLoading && tickets.length > 0 && totalPages > 1" class="mt-6 flex justify-center">
          <Paginator :rows="rowsPerPage" :totalRecords="totalPages * rowsPerPage"
            :first="(currentPage - 1) * rowsPerPage" @page="onPageChange($event)" :rowsPerPageOptions="[]"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink" class="paginator-themed">
            <template #start>
              <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">Page {{ currentPage }} of {{ totalPages
              }}</span>
            </template>
          </Paginator>
        </div>


        <!-- Ticket Detail Dialog -->
        <Dialog v-model:visible="showDetailDialog" modal :closable="true" :showHeader="false" class="dialog-themed"
          :style="{ width: '90%', maxWidth: '550px' }">
          <div v-if="selectedTicket && !detailsLoading" class="p-4 md:p-6">
            <div class="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 class="text-xl font-bold text-green-600 dark:text-green-400">Ticket Details</h2>
              <Button icon="pi pi-times" class="p-button-text p-button-rounded modal-close-button"
                @click="closeDialog" />
            </div>

            <div class="space-y-4">
              <div class="detail-item">
                <span class="detail-label">ID</span>
                <span class="detail-value">{{ selectedTicket.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Title</span>
                <span class="detail-value">{{ selectedTicket.title }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">{{ getTypeLabel(selectedTicket.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="font-medium" :class="getStatusTextClass(selectedTicket.status)">{{ selectedTicket.status
                }}</span>
              </div>
              <div v-if="selectedTicket.vehicleId" class="detail-item">
                <span class="detail-label">Vehicle ID</span>
                <RouterLink v-if="isAdmin" :to="`/vehicles?id=${selectedTicket.vehicleId}`" class="detail-link">
                  {{ selectedTicket.vehicleId }} <i class="pi pi-external-link ml-1 text-xs"></i>
                </RouterLink>
                <span v-else class="detail-value">{{ selectedTicket.vehicleId }}</span>
              </div>
              <div v-if="selectedTicket.userId" class="detail-item">
                <span class="detail-label">User ID</span>
                <span class="detail-value">{{ selectedTicket.userId }}</span>
              </div>
            </div>

            <div class="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
              <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil" class="p-button-outlined" />
              <Button label="Close" @click="closeDialog" class="p-button-text" />
            </div>
          </div>

          <div v-if="detailsLoading" class="p-4 md:p-6 space-y-4">
            <div class="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <Skeleton width="40%" height="1.8rem" />
              <Skeleton shape="circle" size="2rem" />
            </div>
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="60%" height="1.2rem" class="mb-3" />
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="70%" height="1.2rem" class="mb-3" />
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="40%" height="1.2rem" class="mb-3" />
            <div class="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Skeleton width="90px" height="2.5rem" />
            </div>
          </div>

        </Dialog>
      </div>
    </div>

    <button v-if="isAdmin" @click="() => { /* TODO: Implement add new ticket action */ }"
      class="floating-btn bg-green-600 hover:bg-green-700 text-white shadow-lg" aria-label="Add New Ticket">
      <i class="pi pi-plus"></i>
    </button>
  </MenuLayout>
</template>

<style scoped>
:root {
  --text-color: #1f2937;
  --text-color-secondary: #6b7280;
  --text-color-muted: #9ca3af;
  --surface-ground: #f3f4f6;
  --surface-card: #ffffff;
  --surface-overlay: #ffffff;
  --surface-section: #f9fafb;
  --surface-hover: #f3f4f6;
  --surface-border: #e5e7eb;
  --focus-ring-color: #16a34a;
  --primary-color: #10b981;
  --primary-color-text: #ffffff;

  --green-text: #059669;
  --blue-text: #2563eb;
  --red-text: #dc2626;
}

html.dark {
  --text-color: #f3f4f6;
  --text-color-secondary: #9ca3af;
  --text-color-muted: #6b7280;
  --surface-ground: #111827;
  --surface-card: #1f2937;
  --surface-overlay: #1f2937;
  --surface-section: #374151;
  --surface-hover: #374151;
  --surface-border: #4b5563;
  --focus-ring-color: #34d399;
  --primary-color: #34d399;
  --primary-color-text: #111827;

  --green-text: #34d399;
  --blue-text: #60a5fa;
  --red-text: #f87171;
}

.card-themed {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
  transition: background-color 0.3s, border-color 0.3s;
}

html.dark .card-themed {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

.card-themed-skeleton {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
}

:deep(.card-themed-skeleton .p-skeleton) {
  background-color: var(--surface-section) !important;
  opacity: 0.7;
  background-image: linear-gradient(90deg, var(--surface-section) 0%, var(--surface-hover) 50%, var(--surface-section) 100%) !important;
}

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
  z-index: 99;
}

.floating-btn i {
  line-height: 1;
}

:deep(.dialog-themed.p-dialog) {
  background-color: var(--surface-overlay);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

html.dark :deep(.dialog-themed.p-dialog) {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

:deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

html.dark :deep(.p-dialog-mask) {
  background-color: rgba(0, 0, 0, 0.7);
}

:deep(.dialog-themed .p-dialog-content) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
}

.modal-close-button {
  color: var(--text-color-secondary) !important;
}

.modal-close-button:hover {
  color: var(--text-color) !important;
  background-color: var(--surface-hover) !important;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.detail-value {
  font-weight: 500;
  color: var(--text-color);
}

.detail-link {
  font-weight: 500;
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s;
}

.detail-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}

:deep(.paginator-themed.p-paginator) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  color: var(--text-color-secondary);
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03);
}

html.dark :deep(.paginator-themed.p-paginator) {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
}

:deep(.paginator-themed .p-paginator-page),
:deep(.paginator-themed .p-paginator-next),
:deep(.paginator-themed .p-paginator-last),
:deep(.paginator-themed .p-paginator-first),
:deep(.paginator-themed .p-paginator-prev) {
  color: var(--text-color-secondary);
  min-width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  transition: background-color 0.2s, color 0.2s;
}

:deep(.paginator-themed .p-paginator-page.p-highlight) {
  background: var(--primary-color);
  color: var(--primary-color-text);
}

:deep(.paginator-themed .p-paginator-page:not(.p-highlight):hover),
:deep(.paginator-themed .p-paginator-next:not(.p-disabled):hover),
:deep(.paginator-themed .p-paginator-last:not(.p-disabled):hover),
:deep(.paginator-themed .p-paginator-first:not(.p-disabled):hover),
:deep(.paginator-themed .p-paginator-prev:not(.p-disabled):hover) {
  color: var(--primary-color);
  background: var(--surface-hover);
}

:deep(.p-skeleton) {
  background-color: var(--surface-hover);
  background-image: linear-gradient(90deg, var(--surface-hover) 0%, var(--surface-section) 50%, var(--surface-hover) 100%);
  background-size: 400% 100%;
  animation: p-skeleton-animation 1.2s ease-in-out infinite;
}

:deep(.dialog-themed .p-button-outlined) {
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
}

:deep(.dialog-themed .p-button-outlined:hover) {
  background: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-hover);
}

:deep(.dialog-themed .p-button-text) {
  color: var(--text-color-secondary);
}

:deep(.dialog-themed .p-button-text:hover) {
  background: var(--surface-hover);
  color: var(--text-color);
}

:deep(.p-button.p-button-text) {
  color: var(--text-color-secondary);
}

:deep(.p-button.p-button-text:hover) {
  background: var(--surface-hover);
  color: var(--text-color);
}
</style>
