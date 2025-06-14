<script setup lang="ts">
import { onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { useRouter } from 'vue-router';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { useState } from '@/composables/state';
import { ticketService } from '@/services/ticket.service';
import { residenceService } from '@/services/residence.service';
import type { Residence, Ticket } from '@/types';

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
    toast.error("Error fetching ticket summary");
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
    toast.error("Error fetching residence summary");
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

const getStatusBadgeVariant = (status: string | undefined) => {
  switch (status) {
    case 'AVAILABLE': return 'default';
    case 'INUSE': return 'secondary';
    case 'LOST': return 'destructive';
    default: return 'outline';
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
  toast.success('Dashboard data updated.');
};
</script>

<template>
  <MenuLayout>
    <div class="min-h-screen bg-white">
      <div class="max-w-6xl mx-auto px-6 py-12 space-y-12">

        <Title name="Dashboard Overview" subtext="Summary of recent activity" @refresh="refreshAll" />

        <!-- Tickets Section -->
        <section aria-labelledby="tickets-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="tickets-heading" class="text-3xl font-light text-gray-900">Recent Tickets</h2>
            <Button variant="ghost" @click="goToTickets" class="hover:text-blue-600 hover:bg-blue-50">
              View All Tickets
            </Button>
          </div>

          <Card class="overflow-hidden border-blue-100 shadow-xl">
            <CardContent class="p-0">
              <div v-if="ticketState.isLoading.value" class="p-6 space-y-4">
                <Skeleton v-for="i in DASHBOARD_LIMIT" :key="i" class="h-12 w-full rounded" />
              </div>
              <div v-else-if="ticketState.itemList.value.length > 0" class="divide-y divide-gray-100">
                <div v-for="ticket in ticketState.itemList.value" :key="ticket.id"
                     class="flex justify-between items-center px-6 py-4 hover:bg-blue-50/30 transition-colors duration-200">
                  <div>
                    <p class="text-base font-medium text-gray-900">Ticket ID: {{ ticket.id }}</p>
                    <p class="text-sm text-gray-600">Type: {{ getTypeLabel(ticket.type) }}</p>
                  </div>
                  <Badge :variant="getStatusBadgeVariant(ticket.status)"
                         :class="{
                           'bg-blue-100 text-blue-700 hover:bg-blue-200': ticket.status === 'AVAILABLE',
                           'bg-blue-50 text-blue-600 hover:bg-blue-100': ticket.status === 'INUSE',
                           'border-blue-300 text-blue-700 hover:bg-blue-50': ticket.status === 'LOST'
                         }">
                    {{ ticket.status ?? 'UNKNOWN' }}
                  </Badge>
                </div>
              </div>
              <EmptyMessage v-else message="No recent tickets found." class="mt-4" :show-refresh="false" />
            </CardContent>
          </Card>
        </section>

        <!-- Residences Section -->
        <section aria-labelledby="residences-heading">
          <div class="flex justify-between items-center mb-4">
            <h2 id="residences-heading" class="text-3xl font-light text-gray-900">Recent Residences</h2>
            <Button variant="ghost" @click="goToResidences" class="hover:text-blue-600 hover:bg-blue-50">
              View All Residences
            </Button>
          </div>

          <Card class="overflow-hidden border-blue-100 shadow-xl">
            <CardContent class="p-0">
              <div v-if="residenceState.isLoading.value" class="p-6 space-y-4">
                <Skeleton v-for="i in DASHBOARD_LIMIT" :key="i" class="h-12 w-full rounded" />
              </div>
              <div v-else-if="residenceState.itemList.value.length > 0" class="divide-y divide-gray-100">
                <div v-for="residence in residenceState.itemList.value" :key="residence.id"
                     class="flex justify-between items-center px-6 py-4 hover:bg-blue-50/30 transition-colors duration-200">
                  <div>
                    <p class="text-base font-medium text-gray-900">
                      {{ `Building ${residence.building} / Room ${residence.room}` }}
                    </p>
                    <p class="text-sm text-gray-600">ID: {{ residence.id }}</p>
                  </div>
                </div>
              </div>
              <EmptyMessage v-else message="No recent residences found." class="mt-4" :show-refresh="false" />
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  </MenuLayout>
</template>