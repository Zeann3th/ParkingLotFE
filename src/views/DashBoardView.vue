<script setup lang="ts">
import { onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import Skeleton from '@/components/Skeleton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import Button from 'primevue/button';

import { useState } from '@/composables/state';
import { ticketService } from '@/services/ticket.service';
import { residenceService } from '@/services/residence.service';
import type { Residence, Ticket } from '@/types';

const toast = useToast();
const router = useRouter();

const ticketState = useState<Ticket>();
const DASHBOARD_LIMIT = 4;

const residenceState = useState<Residence>();

const fetchTicketSummary = async () => {
  ticketState.isLoading.value = true;
  try {
    const response = await ticketService.getAll(1, DASHBOARD_LIMIT, { cache: true });
    ticketState.itemList.value = response.data;
  } catch (error) {
    console.error("Error fetching ticket summary:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    ticketState.itemList.value = [];
  } finally {
    ticketState.isLoading.value = false;
  }
};

const fetchResidenceSummary = async () => {
  residenceState.isLoading.value = true;
  try {
    const response = await residenceService.getAll(1, DASHBOARD_LIMIT, { cache: true });
    residenceState.itemList.value = response.data;
  } catch (error) {
    console.error("Error fetching residence summary:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    residenceState.itemList.value = [];
  } finally {
    residenceState.isLoading.value = false;
  }
};

onMounted(() => {
  fetchTicketSummary();
  fetchResidenceSummary();
});

const getTypeLabel = (type: string | null | undefined) => {
  if (!type) return 'N/A';
  switch (type) {
    case 'DAILY': return 'Daily Pass';
    case 'MONTHLY': return 'Monthly Subscription';
    case 'RESERVED': return 'Reserved Spot';
    default: return type;
  }
};

const getStatusBadgeClasses = (status: string | undefined) => {
  const base = 'text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap inline-block';
  if (!status) return `${base} !bg-gray-100 !text-gray-700 dark:!bg-gray-700/50 dark:!text-gray-300`;
  switch (status) {
    case 'AVAILABLE': return `${base} !bg-green-100 !text-green-700 dark:!bg-green-900/50 dark:!text-green-300`;
    case 'INUSE': return `${base} !bg-blue-100 !text-blue-700 dark:!bg-blue-900/50 dark:!text-blue-300`;
    case 'LOST': return `${base} !bg-red-100 !text-red-700 dark:!bg-red-900/50 dark:!text-red-300`;
    default: return `${base} !bg-gray-100 !text-gray-700 dark:!bg-gray-700/50 dark:!text-gray-300`;
  }
};

const goToTickets = () => {
  router.push('/tickets');
};

const goToResidences = () => {
  router.push('/residences');
};

const refreshAll = () => {
  ticketState.isMutated.value = true;
  residenceState.isMutated.value = true;
  fetchTicketSummary().finally(() => ticketState.isMutated.value = false);
  fetchResidenceSummary().finally(() => residenceState.isMutated.value = false);
  toast.add({ severity: 'success', summary: 'Refreshed', detail: 'Dashboard data updated.', life: 1500 });
}

</script>

<template>
  <MenuLayout>
    <div class="min-h-screen !bg-gray-50 dark:!bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div class="max-w-7xl mx-auto space-y-8">

        <Title name="Dashboard Overview" subtext="Summary of recent activity" @refresh="refreshAll" />

        <!-- Tickets Section -->
        <section aria-labelledby="tickets-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="tickets-heading" class="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Tickets</h2>
            <Button label="View All Tickets" icon="pi pi-arrow-right" iconPos="right"
              class="p-button-sm p-button-text !text-primary hover:!text-primary/80" @click="goToTickets" />
          </div>

          <!-- Skeleton Loading for Tickets -->
          <Skeleton v-if="ticketState.isLoading.value" type="list" :count="DASHBOARD_LIMIT" />

          <!-- Ticket List -->
          <div v-else-if="ticketState.itemList.value.length > 0" class="space-y-3">
            <div v-for="ticket in ticketState.itemList.value" :key="ticket.id" class="
                 bg-white dark:bg-gray-800
                 rounded-md shadow-sm
                 border border-gray-200 dark:border-gray-700
                 p-3 flex justify-between items-center gap-3
               ">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  Ticket ID: {{ ticket.id }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Type: {{ getTypeLabel(ticket.type) }}
                </p>
              </div>
              <span :class="getStatusBadgeClasses(ticket.status)">
                {{ ticket.status ?? 'UNKNOWN' }}
              </span>
            </div>
          </div>

          <!-- Empty State for Tickets -->
          <EmptyMessage v-else message="No recent tickets found." class="mt-4" :show-refresh="false" />
        </section>

        <!-- Residences Section -->
        <section aria-labelledby="residences-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="residences-heading" class="text-xl font-semibold text-gray-800 dark:text-gray-200">Recent Residences
            </h2>
            <Button label="View All Residences" icon="pi pi-arrow-right" iconPos="right"
              class="p-button-sm p-button-text !text-primary hover:!text-primary/80" @click="goToResidences" />
          </div>

          <!-- Skeleton Loading for Residences -->
          <Skeleton v-if="residenceState.isLoading.value" type="list" :count="DASHBOARD_LIMIT" />

          <!-- Residence List -->
          <div v-else-if="residenceState.itemList.value.length > 0" class="space-y-3">
            <div v-for="residence in residenceState.itemList.value" :key="residence.id" class="
                 bg-white dark:bg-gray-800
                 rounded-md shadow-sm
                 border border-gray-200 dark:border-gray-700
                 p-3 flex justify-between items-center gap-3
               ">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {{ `Building ${residence.building} / Room ${residence.room}` }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  ID: {{ residence.id }}
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State for Residences -->
          <EmptyMessage v-else message="No recent residences found." class="mt-4" :show-refresh="false" />
        </section>

      </div>
    </div>
  </MenuLayout>
</template>
