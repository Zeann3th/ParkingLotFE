<script setup lang="ts">
import { computed, watch } from 'vue';
import { useAuth } from '@/composables/auth';
import { Dialog, Button, useToast } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import type { Ticket } from '@/types';
import { ticketService } from '@/services/ticket.service';
import Skeleton from '@/components/Skeleton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import { useState } from '@/composables/state';
import Title from '@/components/Title.vue';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Ticket>();
const { role } = useAuth();
const toast = useToast();
const route = useRoute();

const getAllTickets = async () => {
  isLoading.value = true;
  try {
    const response = await ticketService.getAll(page.value, limit.value, { cache: isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.count;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tickets', life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query, (newQuery) => {
  page.value = parseInt(newQuery.page as string) || 1;
  getAllTickets();
}, { immediate: true });

const getTicketDetail = async (id: number) => {
  isDetailLoading.value = true;
  openDialog("view");

  try {
    const response = await ticketService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ticket details', life: 3000, });
    closeDialog("view");
  } finally {
    isDetailLoading.value = false;
  }
};

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
    <div class="min-h-screen p-4 md:p-6 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Tickets" @click="getAllTickets" />

        <!-- Skeleton Loading -->
        <Skeleton v-if="isLoading" />

        <!-- Tickets Grid -->
        <div v-else-if="itemList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="ticket in itemList" :key="ticket.id"
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
        <div v-else>
          <EmptyMessage message="No Tickets Found." @click="getAllTickets" />
        </div>

        <!-- Ticket Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false" class="dialog-themed"
          :style="{ width: '90%', maxWidth: '550px' }">
          <div v-if="selectedItem && !isDetailLoading" class="p-4 md:p-6">
            <div class="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 class="text-xl font-bold text-green-600 dark:text-green-400">Ticket Details</h2>
              <Button icon="pi pi-times" class="p-button-text p-button-rounded modal-close-button"
                @click="closeDialog('view')" />
            </div>

            <div class="space-y-4">
              <div class="detail-item">
                <span class="detail-label">ID</span>
                <span class="detail-value">{{ selectedItem.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Title</span>
                <span class="detail-value">{{ selectedItem.title }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">{{ getTypeLabel(selectedItem.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="font-medium" :class="getStatusTextClass(selectedItem.status)">{{ selectedItem.status
                }}</span>
              </div>
              <div v-if="selectedItem.vehicleId" class="detail-item">
                <span class="detail-label">Vehicle ID</span>
                <RouterLink v-if="isAdmin" :to="`/vehicles?id=${selectedItem.vehicleId}`" class="detail-link">
                  {{ selectedItem.vehicleId }} <i class="pi pi-external-link ml-1 text-xs"></i>
                </RouterLink>
                <span v-else class="detail-value">{{ selectedItem.vehicleId }}</span>
              </div>
              <div v-if="selectedItem.userId" class="detail-item">
                <span class="detail-label">User ID</span>
                <span class="detail-value">{{ selectedItem.userId }}</span>
              </div>
            </div>

            <div class="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 space-x-3">
              <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil" class="p-button-outlined" />
              <Button label="Close" @click="closeDialog('view')" class="p-button-text" />
            </div>
          </div>

          <div v-if="isDetailLoading" class="p-4 md:p-6 space-y-4">
            <div class="flex justify-between items-center mb-6 border-b border-secondary pb-3">
              <Skeleton width="40%" height="1.8rem" />
              <Skeleton shape="circle" size="2rem" />
            </div>
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="60%" height="1.2rem" class="mb-3" />
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="70%" height="1.2rem" class="mb-3" />
            <Skeleton width="30%" height="1rem" class="mb-1" />
            <Skeleton width="40%" height="1.2rem" class="mb-3" />
            <div class="flex justify-end mt-8 pt-4 border-t border-gray-200">
              <Skeleton width="90px" height="2.5rem" />
            </div>
          </div>

        </Dialog>
      </div>
    </div>

    <FloatingButton v-if="isAdmin" icon="+" @click="() => console.log('Clicked')" />
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
