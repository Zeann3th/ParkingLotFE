<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Dialog, Button, useToast } from 'primevue';
import { useRoute } from 'vue-router';
import MenuLayout from '@/components/MenuLayout.vue';
import { type CreateTicket, type Ticket } from '@/types';
import { ticketService } from '@/services/ticket.service';
import Skeleton from '@/components/Skeleton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import { useState } from '@/composables/state';
import Title from '@/components/Title.vue';
import InputText from '@/components/InputText.vue';
import { useAuth } from '@/composables/auth';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Ticket>();
const isEditing = ref(false);
const toast = useToast();
const route = useRoute();

const isPrivilledged = computed(() => {
  const { role } = useAuth();
  return role.value === 'ADMIN' || role.value === 'SECURITY';
})

const createTicketPayload = ref<CreateTicket>({
  type: null,
  userId: undefined,
  vehicleId: undefined,
  sectionId: undefined,
  slot: undefined,
})

const getAllTickets = async () => {
  isLoading.value = true;
  try {
    const response = await ticketService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.count;
    isMutated.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tickets', life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

watch(() => route.query.page, (newPage) => {
  page.value = parseInt(newPage as string) || 1;
  getAllTickets();
}, { immediate: true });

const getTicketDetail = async (id: number) => {
  selectedItem.value = null;
  openDialog("view");
  try {
    const response = await ticketService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ticket details', life: 3000, });
    closeDialog("view");
  }
};

const createTicket = async () => {
  try {
    await ticketService.create(createTicketPayload.value)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create ticket', life: 3000, });
  } finally {
    closeDialog("create");
    getAllTickets();
  }
}

const updateTicket = async () => {
  if (!selectedItem.value) return;
  try {
    await ticketService.update(selectedItem.value.id, {
      type: selectedItem.value.type,
      status: selectedItem.value.status,
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update ticket', life: 3000, });
  } finally {
    isEditing.value = false;
    closeDialog("view");
    getAllTickets();
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'DAILY': return 'Daily Pass';
    case 'MONTHLY': return 'Monthly Subscription';
    case 'RESERVED': return 'Reserved Spot';
    default: return type;
  }
};

const getStatusBadgeClasses = (status: string) => {
  const base = 'text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap inline-block';
  switch (status) {
    case 'AVAILABLE': return `${base} !bg-green-100 !text-green-700 dark:!bg-green-900/50 dark:!text-green-300`;
    case 'INUSE': return `${base} !bg-blue-100 !text-blue-700 dark:!bg-blue-900/50 dark:!text-blue-300`;
    case 'LOST': return `${base} !bg-red-100 !text-red-700 dark:!bg-red-900/50 dark:!text-red-300`;
    default: return `${base} !bg-gray-100 !text-gray-700 dark:!bg-gray-700/50 dark:!text-gray-300`;
  }
};

const getStatusTextClasses = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return 'font-medium text-green-600 dark:text-green-400';
    case 'INUSE': return 'font-medium text-blue-600 dark:text-blue-400';
    case 'LOST': return 'font-medium text-red-600 dark:text-red-400';
    default: return 'font-medium text-gray-600 dark:text-gray-400';
  }
};

</script>

<template>
  <MenuLayout>
    <div class="min-h-screen !bg-gray-50 dark:!bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <Title name="Tickets" subtext="View and manage parking tickets" @click="getAllTickets" class="mb-6 md:mb-8" />

        <!-- Skeleton Loading -->
        <Skeleton v-if="isLoading" type="grid-card" :count="limit" />

        <!-- Tickets Grid -->
        <div v-else-if="itemList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">

          <!-- === Ticket Card Start === -->
          <div v-for="ticket in itemList" :key="ticket.id" class="
              ticket-card  relative
              !bg-white dark:!bg-gray-800
              rounded-lg shadow-sm hover:shadow-lg
              border border-gray-200 dark:border-gray-700
              flex flex-col overflow-hidden
              transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer
            " @click="getTicketDetail(ticket.id)" role="button">
            <!-- Main Ticket Body -->
            <div class="p-5 flex-grow">
              <div class="flex justify-between items-start mb-3 gap-2">
                <span :class="getStatusBadgeClasses(ticket.status)">
                  {{ ticket.status }}
                </span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {{ getTypeLabel(ticket.type) }}
              </div>
            </div>
            <!-- Perforation Line & Stub -->
            <div class="
                  ticket-stub
                  border-t-2 border-dashed border-gray-300 dark:border-gray-600
                  mt-auto
                  bg-gray-50 dark:bg-gray-700/50
                  px-5 py-3
                ">
              <div class="text-xs text-gray-500 dark:text-gray-400 text-center font-mono tracking-wider">
                TICKET ID: {{ ticket.id }}
              </div>
            </div>
          </div>
          <!-- === Ticket Card End === -->
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else message="No tickets found matching your criteria." @refresh="getAllTickets"
          class="mt-10" />

        <!-- Ticket Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          class="!bg-white dark:!bg-gray-800 !text-black !rounded-xl !shadow-xl !border !border-gray-200 dark:!border-gray-700"
          :style="{ width: '95%', maxWidth: '550px' }">
          <!-- Custom Header -->
          <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Ticket Details</h2>
            <Button icon="pi pi-times"
              class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
              @click="closeDialog('view')" aria-label="Close dialog" unstyled />
          </div>
          <!-- Content Area -->
          <div v-if="selectedItem" class="p-5 md:p-6">
            <div class="grid grid-cols-3 gap-x-4 gap-y-4">
              <!-- ID -->
              <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</span>
              <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ selectedItem.id }}</span>
              <!-- Type -->
              <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Type</span>
              <span v-if="!isEditing" class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{
                getTypeLabel(selectedItem.type) }}</span>
              <InputText v-else-if="isEditing && selectedItem" v-model="selectedItem.type" inputId="ticketType" />
              <span></span>
              <!-- Status -->
              <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Status</span>
              <span v-if="!isEditing" :class="getStatusTextClasses(selectedItem.status)" class="col-span-2 text-sm">{{
                selectedItem.status
              }}</span>
              <InputText v-else-if="isEditing && selectedItem" v-model="selectedItem.status" inputId="ticketStatus" />
              <span></span>
              <!-- Vehicle ID -->
              <template v-if="selectedItem.vehicleId">
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle ID</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ selectedItem.vehicleId }}</span>
              </template>
              <!-- User ID -->
              <template v-if="selectedItem.userId">
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">User ID</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ selectedItem.userId }}</span>
              </template>
            </div>
          </div>
          <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
            Loading ticket details...
          </div>
          <!-- Footer/Actions -->
          <div
            class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <Button v-if="isPrivilledged && !isEditing" label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-outlined
                     !border-primary-500 !text-primary-600 hover:!bg-primary-50
                     dark:!border-primary-400 dark:!text-primary-300 dark:hover:!bg-primary-900/20
                     focus:!ring-2 focus:!ring-primary-500/50" @click="isEditing = true" />
            <Button v-if="isPrivilledged && isEditing" label="Save" icon="pi pi-check" class="p-button-sm p-button-outlined
                     !border-primary-500 !text-primary-600 hover:!bg-primary-50
                     dark:!border-primary-400 dark:!text-primary-300 dark:hover:!bg-primary-900/20
                     focus:!ring-2 focus:!ring-primary-500/50" @click="updateTicket" />
            <Button label="Close" class="p-button-sm p-button-text
                     !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                     focus:!ring-2 focus:!ring-gray-500/50"
              @click="() => { closeDialog('view'); isEditing = false }" />
          </div>
        </Dialog>

        <!-- Create Ticket Dialog -->
        <Dialog v-model:visible="dialogs.create" modal :closable="true" :showHeader="false"
          class="!bg-white dark:!bg-gray-800 !text-black !rounded-xl !shadow-xl !border !border-gray-200 dark:!border-gray-700"
          :style="{ width: '95%', maxWidth: '550px' }">
          <!-- Custom Header -->
          <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Ticket</h2>
            <Button icon="pi pi-times"
              class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
              @click="closeDialog('create')" aria-label="Close dialog" unstyled />
          </div>

          <!-- Content Area / Form -->
          <div class="p-5 md:p-6 space-y-4">
            <!-- Ticket Type -->
            <div>
              <label for="ticketType" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Ticket
                Type</label>
              <select id="ticketType" v-model="createTicketPayload.type" class="
                  block w-full rounded-md shadow-sm text-sm
                  border-gray-300 dark:border-gray-600
                  focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-50
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-gray-200
                  px-3 py-2
                ">
                <option disabled value="">Select Type</option>
                <option v-for="type in ['DAILY', 'MONTHLY', 'RESERVED']" :key="type" :value="type">
                  {{ getTypeLabel(type) }}
                </option>
              </select>
            </div>

            <!-- User Id -->
            <div>
              <label for="userId" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">User
                (Optional)</label>
              <InputNumber v-model="createTicketPayload.userId" inputId="userId" placeholder="Enter User ID" />
            </div>

            <!-- Vehicle Id -->
            <div>
              <label for="vehicleId" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Vehicle
                (Optional)</label>
              <InputNumber v-model="createTicketPayload.vehicleId" inputId="vehicleId" placeholder="Enter Vehicle ID" />
            </div>

            <!-- Section Id -->
            <div>
              <label for="sectionId" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Section
                (Optional)</label>
              <InputNumber v-model="createTicketPayload.sectionId" inputId="sectionId" placeholder="Enter Section ID" />
            </div>

            <!-- Slot -->
            <div>
              <label for="slot" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">Slot
                (Optional)</label>
              <InputNumber v-model="createTicketPayload.slot" inputId="slot" placeholder="Enter Slot Number" />
            </div>
          </div>

          <!-- Footer/Actions -->
          <div
            class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <Button label="Save" icon="pi pi-check" class="p-button-sm p-button-outlined
                     !border-primary-500 !text-primary-600 hover:!bg-primary-50
                     dark:!border-primary-400 dark:!text-primary-300 dark:hover:!bg-primary-900/20
                     focus:!ring-2 focus:!ring-primary-500/50" @click="createTicket" />
            <Button label="Cancel" class="p-button-sm p-button-text
                     !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                     focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('create')" />
          </div>
        </Dialog>
      </div>
    </div>

    <FloatingButton v-if="isPrivilledged" icon="+" @click="openDialog('create')" aria-label="Add new ticket" />
  </MenuLayout>
</template>

<style scoped>
.pi {
  vertical-align: middle;
}
</style>
