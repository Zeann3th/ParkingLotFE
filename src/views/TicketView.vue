<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Dialog, Button, useToast } from 'primevue';
import MenuLayout from '@/components/MenuLayout.vue';
import { type User, type CreateTicket, type Ticket, type Vehicle } from '@/types';
import { ticketService } from '@/services/ticket.service';
import Skeleton from '@/components/Skeleton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import FloatingButton from '@/components/FloatingButton.vue';
import { useState } from '@/composables/state';
import Title from '@/components/Title.vue';
import InputText from '@/components/InputText.vue';
import InputNumber from '@/components/InputNumber.vue';
import { useAuth } from '@/composables/auth';
import { userService } from '@/services/user.service';
import { vehicleService } from '@/services/vehicle.service';
import debounce from 'lodash.debounce';

const { isLoading, isMutated, page, limit, maxPage, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Ticket>({ limit: 20 });
const isEditing = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

const isUserDropdownVisible = ref(false);
const user = ref<User | null>(null);
const users = ref<User[]>([]);
const userInput = ref<string | null>(null);

const isVehicleDropdownVisible = ref(false);
const vehicles = ref<Vehicle[]>([]);
const vehicleInput = ref<string | null>(null);
const vehicle = ref<Vehicle | null>(null);

const toast = useToast();

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

const getTicketDetail = async (id: number) => {
  selectedItem.value = null;
  openDialog("view");
  try {
    selectedItem.value = await ticketService.getById(id);
    if (selectedItem.value.userId) user.value = await userService.getById(selectedItem.value.userId)
    if (selectedItem.value.vehicleId) vehicle.value = await vehicleService.getById(selectedItem.value.vehicleId)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load ticket details', life: 3000, });
    closeDialog("view");
  }
};

const createTicket = async () => {
  try {
    createTicketPayload.value.userId = user.value?.id;
    await ticketService.create(createTicketPayload.value)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create ticket', life: 3000, });
  } finally {
    closeDialog("create");
    user.value = null;
    userInput.value = null;
    users.value = [];
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

const handleScroll = () => {
  if (!isLoading.value && page.value < maxPage.value) {
    console.log("Reached bottom, loading more...");
    page.value += 1;
    isLoading.value = true;

    ticketService.getAll(page.value, limit.value, { cache: !isMutated.value })
      .then((response) => {
        if (response.data && response.data.length > 0) {
          itemList.value.push(...response.data);
        }
        maxPage.value = response.count;
      })
      .catch(() => {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load more tickets', life: 3000 });
      })
      .finally(() => {
        isLoading.value = false;
      });
  }
};

const selectUser = (selectedUser: User) => {
  user.value = selectedUser;
  userInput.value = selectedUser.name;
  isUserDropdownVisible.value = false;
}

const closeUserDropdown = (event: MouseEvent) => {
  const userDropdown = document.getElementById('user-dropdown');
  const userInput = document.getElementById('user-input');

  if (userDropdown &&
    !userDropdown.contains(event.target as Node) &&
    !userInput?.contains(event.target as Node)) {
    isUserDropdownVisible.value = false;
  }
}

const selectVehicle = (selectedVehicle: Vehicle) => {
  vehicle.value = selectedVehicle;
  vehicleInput.value = selectedVehicle.plate;
  createTicketPayload.value.vehicleId = selectedVehicle.id;
  isVehicleDropdownVisible.value = false;
}

const closeVehicleDropdown = (event: MouseEvent) => {
  const vehicleDropdown = document.getElementById('vehicle-dropdown');
  const vehicleInputEl = document.getElementById('vehicle-input');

  if (vehicleDropdown &&
    !vehicleDropdown.contains(event.target as Node) &&
    !vehicleInputEl?.contains(event.target as Node)) {
    isVehicleDropdownVisible.value = false;
  }
}

const debouncedVehicleSearch = debounce(async (value: string) => {
  if (vehicle.value && (value !== vehicle.value.plate)) {
    vehicle.value = null;
    createTicketPayload.value.vehicleId = undefined;
  }

  if (value) {
    try {
      vehicles.value = await vehicleService.search({ plate: value });
      isVehicleDropdownVisible.value = vehicles.value.length > 0;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load vehicles', life: 3000 });
    }
  } else {
    isVehicleDropdownVisible.value = false;
    vehicles.value = [];
  }
}, 300);

const debouncedUserSearch = debounce(async (value: string | null) => {
  if (user.value && (value !== user.value.name)) {
    user.value = null;
    createTicketPayload.value.userId = undefined;
  }

  let params: { email?: string, name?: string } = {};
  if (value) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      params.email = value;
    } else {
      params.name = value;
    }
    try {
      const res = await userService.search(params);
      users.value = res;
      isUserDropdownVisible.value = users.value.length > 0;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users', life: 3000, });
    }
  } else {
    isUserDropdownVisible.value = false;
    users.value = [];
  }
}, 300);

onMounted(() => {
  getAllTickets();
  scrollContainer.value?.addEventListener('scroll', handleScroll);
  document.addEventListener('click', closeUserDropdown);
  document.addEventListener('click', closeVehicleDropdown);
});

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', closeUserDropdown);
  document.removeEventListener('click', closeVehicleDropdown);
});

watch(userInput, (newVal) => {
  if (newVal) {
    debouncedUserSearch(newVal);
  } else {
    isUserDropdownVisible.value = false;
    users.value = [];
  }
});

watch(vehicleInput, (newVal) => {
  if (newVal) {
    debouncedVehicleSearch(newVal);
  } else {
    isVehicleDropdownVisible.value = false;
    vehicles.value = [];
  }
});

const closeCreateDialog = () => {
  closeDialog("create");
  users.value = [];
  user.value = null;
  userInput.value = null;
  vehicles.value = [];
  vehicleInput.value = null;
}
</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
      class="min-h-screen !bg-gray-50 dark:!bg-gray-900 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
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
              <!-- Vehicle -->
              <template v-if="vehicle">
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ vehicle.plate }}
                  ({{ vehicle.type.toLowerCase() }})</span>
              </template>
              <!-- User -->
              <template v-if="user">
                <span class="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">User</span>
                <span class="col-span-2 text-sm text-gray-700 dark:text-gray-300">{{ user.name }} ({{ user.username
                }})</span>
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
              @click="closeCreateDialog" aria-label="Close dialog" unstyled />
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

            <!-- User with Dropdown -->
            <div class="relative">
              <label for="user-input" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                User (Optional)
              </label>
              <div class="relative">
                <InputText v-model="userInput" inputId="user-input" placeholder="Enter User name or Email"
                  @focus="isUserDropdownVisible = true" />
                <!-- Selected User Chip -->
                <div v-if="user" class="mt-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {{ user.name }}
                    <button type="button"
                      class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      @click="user = null; userInput = ''; createTicketPayload.userId = undefined">
                      <span class="sr-only">Remove user</span>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </span>
                </div>
                <!-- User Dropdown -->
                <div id="user-dropdown" v-if="isUserDropdownVisible"
                  class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div v-if="users.length === 0" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No users found
                  </div>
                  <div v-for="userOption in users" :key="userOption.id"
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                    @click="selectUser(userOption)">
                    <div class="flex items-center">
                      <span class="font-normal block truncate">{{ userOption.name }}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {{ userOption.username }} - {{ userOption.email }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vehicle with Dropdown -->
            <div class="relative">
              <label for="vehicle-input" class="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                Vehicle (Optional)
              </label>
              <div class="relative">
                <InputText v-model="vehicleInput" inputId="vehicle-input" placeholder="Enter Vehicle plate"
                  @focus="isVehicleDropdownVisible = true" />
                <!-- Selected Vehicle Chip -->
                <div v-if="vehicle" class="mt-2">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    {{ vehicle.plate }}
                    <button type="button"
                      class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      @click="vehicle = null; vehicleInput = ''; createTicketPayload.vehicleId = undefined">
                      <span class="sr-only">Remove vehicle</span>
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </span>
                </div>
                <!-- Vehicle Dropdown -->
                <div id="vehicle-dropdown" v-if="isVehicleDropdownVisible"
                  class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div v-if="vehicles.length === 0" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    No vehicles found
                  </div>
                  <div v-for="vehicleOption in vehicles" :key="vehicleOption.id"
                    class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-600"
                    @click="selectVehicle(vehicleOption)">
                    <div class="flex items-center">
                      <span class="font-normal block truncate">{{ vehicleOption.plate }}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {{ vehicleOption.type }}
                    </div>
                  </div>
                </div>
              </div>
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

            <!-- Footer/Actions -->
            <div
              class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <Button label="Save" icon="pi pi-check" class="p-button-sm p-button-outlined
                     !border-primary-500 !text-primary-600 hover:!bg-primary-50
                     dark:!border-primary-400 dark:!text-primary-300 dark:hover:!bg-primary-900/20
                     focus:!ring-2 focus:!ring-primary-500/50" @click="createTicket" />
              <Button label="Cancel" class="p-button-sm p-button-text
                     !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                     focus:!ring-2 focus:!ring-gray-500/50" @click="closeCreateDialog" />
            </div>
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
