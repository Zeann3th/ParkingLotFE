<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Dialog, Button, useToast } from 'primevue';
import Skeleton from '@/components/Skeleton.vue';
import MenuLayout from '@/components/MenuLayout.vue';
import type { CreateResidence, Residence, Vehicle, User } from '@/types';
import { residenceService } from '@/services/residence.service';
import FloatingButton from '@/components/FloatingButton.vue';
import EmptyMessage from '@/components/EmptyMessage.vue';
import Title from '@/components/Title.vue';
import { useState } from '@/composables/state';
import { useAuth } from '@/composables/auth';
import InputText from '@/components/InputText.vue';
import InputNumber from '@/components/InputNumber.vue';
import debounce from 'lodash.debounce';
import { userService } from '@/services/user.service';
import { vehicleService } from '@/services/vehicle.service';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Residence>({ limit: 20 });
const toast = useToast();
const scrollContainer = ref<HTMLElement | null>(null);
const isEditing = ref(false);

const residentInput = ref<string>('');
const selectedResidentToAdd = ref<User | null>(null);
const searchedUsers = ref<User[]>([]);
const isUserSearchDropdownVisible = ref(false);

const vehicleInput = ref<string>('');
const selectedVehicleToAdd = ref<Vehicle | null>(null);
const searchedVehicles = ref<Vehicle[]>([]);
const isVehicleSearchDropdownVisible = ref(false);

const isAdmin = computed(() => {
  const { role } = useAuth();
  return role.value === "ADMIN";
})

const createResidencePayload = ref<CreateResidence>({
  building: '',
  room: 0,
})

const getAllResidences = async () => {
  isLoading.value = true;
  try {
    const response = await residenceService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.maxPage;
    isMutated.value = false;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000, });
  } finally {
    isLoading.value = false;
  }
};

const getResidenceDetail = async (id: number) => {
  openDialog("view");
  isDetailLoading.value = true;
  selectedItem.value = null;
  isEditing.value = false;
  resetAddFields();

  try {
    const response = await residenceService.getById(id);
    selectedItem.value = response;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    closeDialogAndReset("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const toggleEditMode = () => {
  isEditing.value = !isEditing.value;
  if (!isEditing.value) {
    resetAddFields();
  }
};

const updateResidence = async () => {
  if (!selectedItem.value) return;
  isEditing.value = false;
  refreshData();
};

const createResidence = async () => {
  try {
    await residenceService.create(createResidencePayload.value);
    refreshData();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
    return;
  } finally {
    closeDialog('create');
    createResidencePayload.value = { building: '', room: 0 };
  }
};

const deleteResidence = async () => {
  if (!selectedItem.value) return;
  try {
    await residenceService.delete(selectedItem.value.id);
    closeDialogAndReset('view');
    refreshData();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error, life: 3000 });
  }
}

const addResident = async () => {
  if (!selectedItem.value || !selectedResidentToAdd.value) {
    toast.add({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a resident from the search results first.', life: 3000 });
    return;
  }
  try {
    await residenceService.addResident(selectedItem.value.id, selectedResidentToAdd.value.id);
    if (!selectedItem.value.residents?.find(u => u.id === selectedResidentToAdd.value?.id)) {
      selectedItem.value.residents = [...(selectedItem.value.residents || []), selectedResidentToAdd.value];
    }
    resetResidentSearch();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error Adding Resident', detail: error, life: 3000 });
  }
};

const removeResident = async (userId: number) => {
  if (!selectedItem.value) return;
  try {
    await residenceService.removeResident(selectedItem.value.id, userId);
    selectedItem.value.residents = selectedItem.value.residents?.filter((user) => user.id !== userId) || [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error Removing Resident', detail: error, life: 3000 });
  }
};

const selectResidentToAdd = (selectedUser: User) => {
  selectedResidentToAdd.value = selectedUser;
  residentInput.value = selectedUser.name;
  isUserSearchDropdownVisible.value = false;
  searchedUsers.value = [];
}

const closeUserSearchDropdown = (event: MouseEvent) => {
  const userDropdown = document.getElementById('add-resident-dropdown');
  const userInput = document.getElementById('add-resident-input');

  if (userDropdown &&
    !userDropdown.contains(event.target as Node) &&
    !userInput?.contains(event.target as Node)) {
    isUserSearchDropdownVisible.value = false;
  }
}

const debouncedUserSearch = debounce(async (value: string | null) => {
  if (selectedResidentToAdd.value && (value !== selectedResidentToAdd.value.name)) {
    selectedResidentToAdd.value = null;
  }
  if (!value || value.length < 2) {
    searchedUsers.value = [];
    isUserSearchDropdownVisible.value = false;
    return;
  }

  let params: { email?: string, name?: string } = {};
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    params.email = value;
  } else {
    params.name = value;
  }
  try {
    const currentResidentIds = selectedItem.value?.residents?.map(u => u.id) || [];
    const res = await userService.search(params);
    searchedUsers.value = res.filter(user => !currentResidentIds.includes(user.id));
    isUserSearchDropdownVisible.value = searchedUsers.value.length > 0;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'User Search Error', detail: 'Failed to load users', life: 3000, });
    searchedUsers.value = [];
    isUserSearchDropdownVisible.value = false;
  }
}, 500);

const addVehicle = async () => {
  if (!selectedItem.value || !selectedVehicleToAdd.value) {
    toast.add({ severity: 'warn', summary: 'Selection Required', detail: 'Please select a vehicle from the search results first.', life: 3000 });
    return;
  }
  try {
    await residenceService.addVehicle(selectedItem.value.id, selectedVehicleToAdd.value.id);
    if (!selectedItem.value.vehicles?.find(v => v.id === selectedVehicleToAdd.value?.id)) {
      selectedItem.value.vehicles = [...(selectedItem.value.vehicles || []), selectedVehicleToAdd.value];
    }
    resetVehicleSearch();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error Adding Vehicle', detail: error, life: 3000 });
  }
};

const removeVehicle = async (vehicleId: number) => {
  if (!selectedItem.value) return;
  try {
    await residenceService.removeVehicle(selectedItem.value.id, vehicleId);
    selectedItem.value.vehicles = selectedItem.value.vehicles?.filter((vehicle) => vehicle.id !== vehicleId) || [];
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error Removing Vehicle', detail: error, life: 3000 });
  }
};

const selectVehicleToAdd = (selectedVehicle: Vehicle) => {
  selectedVehicleToAdd.value = selectedVehicle;
  vehicleInput.value = selectedVehicle.plate;
  isVehicleSearchDropdownVisible.value = false;
  searchedVehicles.value = [];
}

const closeVehicleSearchDropdown = (event: MouseEvent) => {
  const vehicleDropdown = document.getElementById('add-vehicle-dropdown');
  const vehicleInputEl = document.getElementById('add-vehicle-input');

  if (vehicleDropdown &&
    !vehicleDropdown.contains(event.target as Node) &&
    !vehicleInputEl?.contains(event.target as Node)) {
    isVehicleSearchDropdownVisible.value = false;
  }
}

const debouncedVehicleSearch = debounce(async (value: string) => {
  if (selectedVehicleToAdd.value && (value !== selectedVehicleToAdd.value.plate)) {
    selectedVehicleToAdd.value = null;
  }
  if (!value || value.length < 2) {
    searchedVehicles.value = [];
    isVehicleSearchDropdownVisible.value = false;
    return;
  }

  if (value) {
    try {
      const currentVehicleIds = selectedItem.value?.vehicles?.map(v => v.id) || [];
      const res = await vehicleService.search({ plate: value });
      searchedVehicles.value = res.filter(vehicle => !currentVehicleIds.includes(vehicle.id));
      isVehicleSearchDropdownVisible.value = searchedVehicles.value.length > 0;
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Vehicle Search Error', detail: 'Failed to load vehicles', life: 3000 });
      searchedVehicles.value = [];
      isVehicleSearchDropdownVisible.value = false;
    }
  } else {
    isVehicleSearchDropdownVisible.value = false;
    searchedVehicles.value = [];
  }
}, 500);

const refreshData = () => {
  isMutated.value = true;
  itemList.value = [];
  getAllResidences();
}

const getVehicleTypeIcon = (type: string | undefined) => {
  if (!type) return 'pi pi-question-circle';
  switch (type.toUpperCase()) {
    case 'CAR': return 'pi pi-car';
    case 'MOTORBIKE': return 'pi pi-bolt';
    default: return 'pi pi-question-circle';
  }
};

const handleScroll = () => {
  const el = scrollContainer.value;
  if (el && !isLoading.value && page.value < maxPage.value) {
    // Check if near bottom
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      page.value += 1;
      isLoading.value = true;
      residenceService.getAll(page.value, limit.value, { cache: !isMutated.value })
        .then((response) => {
          if (response.data && response.data.length > 0) {
            itemList.value.push(...response.data);
          }
          maxPage.value = response.maxPage;
        })
        .catch(() => {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load more residences', life: 3000 });
          page.value -= 1; // Revert page increment on error
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
  }
};

const resetAddFields = () => {
  residentInput.value = '';
  selectedResidentToAdd.value = null;
  searchedUsers.value = [];
  isUserSearchDropdownVisible.value = false;

  vehicleInput.value = '';
  selectedVehicleToAdd.value = null;
  searchedVehicles.value = [];
  isVehicleSearchDropdownVisible.value = false;
};

const resetResidentSearch = () => {
  residentInput.value = '';
  selectedResidentToAdd.value = null;
  searchedUsers.value = [];
  isUserSearchDropdownVisible.value = false;
}
const resetVehicleSearch = () => {
  vehicleInput.value = '';
  selectedVehicleToAdd.value = null;
  searchedVehicles.value = [];
  isVehicleSearchDropdownVisible.value = false;
}

const closeDialogAndReset = (dialogKey: keyof typeof dialogs.value) => {
  closeDialog(dialogKey);
  resetAddFields();
  isEditing.value = false;
}


onMounted(() => {
  getAllResidences();
  scrollContainer.value?.addEventListener('scroll', handleScroll);
  document.addEventListener('click', closeUserSearchDropdown);
  document.addEventListener('click', closeVehicleSearchDropdown);
});

onBeforeUnmount(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', closeUserSearchDropdown);
  document.removeEventListener('click', closeVehicleSearchDropdown);
});

watch(residentInput, (newVal) => {
  if (isEditing.value) {
    debouncedUserSearch(newVal);
  } else {
    isUserSearchDropdownVisible.value = false;
    searchedUsers.value = [];
  }
});

watch(vehicleInput, (newVal) => {
  if (isEditing.value) {
    debouncedVehicleSearch(newVal);
  } else {
    isVehicleSearchDropdownVisible.value = false;
    searchedVehicles.value = [];
  }
});

</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
      class="min-h-screen p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <Title name="Residences" @click="refreshData" class="mb-6" />
        <Skeleton v-if="isLoading && itemList.length === 0" type="grid" :count="limit" />
        <div v-else-if="itemList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <!-- Residence Card -->
          <div v-for="residence in itemList" :key="residence.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700 flex flex-col"
            @click="getResidenceDetail(residence.id)" role="button"
            :aria-label="`View details for Residence ${residence.building}-${residence.room}`">
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="font-semibold text-black line-clamp-1 break-all flex-1"
                :title="`Building ${residence.building}, Room ${residence.room}`">
                <i class="pi pi-building mr-2 text-xs"></i>{{ `Building ${residence.building} / Room ${residence.room}`
                }}
              </h2>
            </div>

            <!-- Card Footer -->
            <div
              class="text-xs text-gray-400 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700/50">
              ID: {{ residence.id }}
            </div>
          </div>
          <div v-if="isLoading && itemList.length > 0" class="col-span-full text-center py-4">
            <i class="pi pi-spin pi-spinner text-primary" style="font-size: 1.5rem"></i> Loading more...
          </div>
        </div>

        <!-- Empty State -->
        <EmptyMessage v-else-if="!isLoading && itemList.length === 0" message="No Residences Found."
          @refresh="refreshData" icon="pi pi-building" />


        <!-- Residence Detail Dialog -->
        <Dialog v-model:visible="dialogs.view" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '600px' }" @after-hide="resetAddFields"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">

          <div>
            <!-- Dialog Header -->
            <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {{ isEditing ? 'Edit Residence' : 'Residence Details' }}
              </h2>
              <Button icon="pi pi-times"
                class="p-button-text p-button-rounded !w-8 !h-8 !text-gray-500 dark:!text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:!ring-2 focus:!ring-primary-500/50"
                @click="closeDialogAndReset('view')" aria-label="Close dialog" />
            </div>

            <!-- Detail Loading Skeleton -->
            <div v-if="isDetailLoading" class="p-6 text-center text-gray-500 dark:text-gray-400">
              <!-- Simple spinner or use Skeleton component -->
              <i class="pi pi-spin pi-spinner text-primary" style="font-size: 2rem"></i>
              <p>Loading Details...</p>
            </div>

            <!-- Residence Details Content -->
            <div v-if="selectedItem && !isDetailLoading" class="p-5 md:p-6 max-h-[70vh] overflow-y-auto">
              <div class="space-y-4">
                <!-- Detail Row: ID -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">ID</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right break-all">{{ selectedItem.id
                  }}</span>
                </div>
                <!-- Detail Row: Building -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Building</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ selectedItem.building }}</span>
                </div>
                <!-- Detail Row: Room -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Room</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ selectedItem.room }}</span>
                </div>

                <!-- === Residents Section === -->
                <div class="pt-2 border-t border-gray-200 dark:border-gray-700/50">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Residents</span>
                  </div>

                  <!-- Residents list -->
                  <div v-if="selectedItem.residents?.length" class="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                    <div v-for="resident in selectedItem.residents" :key="resident.id"
                      class="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700/50">
                      <div class="flex items-center gap-2">
                        <i class="pi pi-user text-primary dark:text-primary-300"></i>
                        <div class="flex flex-col leading-tight">
                          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ resident.name }}</span>
                        </div>
                      </div>
                      <Button v-if="isEditing && isAdmin" icon="pi pi-trash"
                        class="p-button-sm p-button-rounded p-button-danger p-button-text !w-6 !h-6 !text-xs"
                        aria-label="Remove resident" @click="removeResident(resident.id)"
                        v-tooltip.left="'Remove Resident'" />
                    </div>
                  </div>
                  <div v-else-if="!isEditing" class="text-sm text-gray-400 dark:text-gray-500 italic mb-3">No residents
                    assigned</div>

                  <!-- Add resident input (when editing) -->
                  <div v-if="isEditing && isAdmin" class="relative">
                    <label for="add-resident-input" class="text-xs font-medium text-gray-500 dark:text-gray-400">Add
                      Resident</label>
                    <div class="flex gap-2 items-center mt-1">
                      <div class="relative flex-grow">
                        <InputText v-model="residentInput" inputId="add-resident-input"
                          placeholder="Search by Name or Email" class="w-full text-sm"
                          @focus="isUserSearchDropdownVisible = true" aria-autocomplete="list"
                          aria-controls="add-resident-dropdown" />
                        <!-- User Search Dropdown -->
                        <div id="add-resident-dropdown" v-if="isUserSearchDropdownVisible && searchedUsers.length > 0"
                          class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          <div v-for="userOption in searchedUsers" :key="userOption.id"
                            class="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                            @click="selectResidentToAdd(userOption)">
                            <div class="flex items-center">
                              <span class="font-normal block truncate">{{ userOption.name }}</span>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                              {{ userOption.username }} - {{ userOption.email }}
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="isUserSearchDropdownVisible && searchedUsers.length === 0 && residentInput.length >= 2"
                          class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md p-3 text-sm text-gray-500 dark:text-gray-400">
                          No matching users found.
                        </div>
                      </div>
                      <Button icon="pi pi-plus" class="p-button-sm p-button-rounded" severity="success"
                        aria-label="Add selected resident" @click="addResident" :disabled="!selectedResidentToAdd"
                        v-tooltip.bottom="'Add Selected Resident'" />
                    </div>
                  </div>
                </div>

                <!-- === Vehicles Section === -->
                <div class="pt-2 border-t border-gray-200 dark:border-gray-700/50">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm font-medium text-gray-500 dark:text-gray-400">Vehicles</span>
                  </div>

                  <!-- Vehicles list -->
                  <div v-if="selectedItem.vehicles?.length" class="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                    <div v-for="vehicle in selectedItem.vehicles" :key="vehicle.id"
                      class="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700/50">
                      <div class="flex items-center gap-2">
                        <i :class="[getVehicleTypeIcon(vehicle.type), 'text-primary dark:text-primary-300']"></i>
                        <div class="flex flex-col leading-tight">
                          <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ vehicle.plate }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ vehicle.type }}</span>
                        </div>
                      </div>
                      <Button v-if="isEditing && isAdmin" icon="pi pi-trash"
                        class="p-button-sm p-button-rounded p-button-danger p-button-text !w-6 !h-6 !text-xs"
                        aria-label="Remove vehicle" @click="removeVehicle(vehicle.id)"
                        v-tooltip.left="'Remove Vehicle'" />
                    </div>
                  </div>
                  <div v-else-if="!isEditing" class="text-sm text-gray-400 dark:text-gray-500 italic mb-3">No vehicles
                    registered</div>

                  <!-- Add vehicle input (when editing) -->
                  <div v-if="isEditing && isAdmin" class="relative">
                    <label for="add-vehicle-input" class="text-xs font-medium text-gray-500 dark:text-gray-400">Add
                      Vehicle</label>
                    <div class="flex gap-2 items-center mt-1">
                      <div class="relative flex-grow">
                        <InputText v-model="vehicleInput" inputId="add-vehicle-input"
                          placeholder="Search by License Plate" class="w-full text-sm"
                          @focus="isVehicleSearchDropdownVisible = true" aria-autocomplete="list"
                          aria-controls="add-vehicle-dropdown" />
                        <!-- Vehicle Search Dropdown -->
                        <div id="add-vehicle-dropdown"
                          v-if="isVehicleSearchDropdownVisible && searchedVehicles.length > 0"
                          class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          <div v-for="vehicleOption in searchedVehicles" :key="vehicleOption.id"
                            class="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                            @click="selectVehicleToAdd(vehicleOption)">
                            <div class="flex items-center">
                              <i
                                :class="[getVehicleTypeIcon(vehicleOption.type), 'mr-2 text-primary dark:text-primary-300 text-xs']"></i>
                              <span class="font-normal block truncate">{{ vehicleOption.plate }}</span>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 ml-5">
                              {{ vehicleOption.type }}
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="isVehicleSearchDropdownVisible && searchedVehicles.length === 0 && vehicleInput.length >= 2"
                          class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md p-3 text-sm text-gray-500 dark:text-gray-400">
                          No matching vehicles found.
                        </div>
                      </div>
                      <!-- Add Vehicle Button -->
                      <Button icon="pi pi-plus" class="p-button-sm p-button-rounded" severity="success"
                        aria-label="Add selected vehicle" @click="addVehicle" :disabled="!selectedVehicleToAdd"
                        v-tooltip.bottom="'Add Selected Vehicle'" />
                    </div>
                  </div>
                </div>


                <!-- Detail Row: Created At -->
                <div
                  class="flex justify-between items-start py-1 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Created At</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ new
                    Date(selectedItem.createdAt).toLocaleString() }}</span>
                </div>
                <!-- Detail Row: Updated At -->
                <div class="flex justify-between items-start py-1">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400 w-1/3">Updated At</span>
                  <span class="text-sm text-gray-800 dark:text-gray-100 text-right">{{ new
                    Date(selectedItem.updatedAt).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Dialog Actions/Footer -->
            <div v-if="selectedItem && !isDetailLoading"
              class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <template v-if="!isEditing">
                <Button v-if="isAdmin" label="Edit" icon="pi pi-pencil" class="p-button-sm p-button-outlined
                             !border-accent !bg-accent !text-white hover:!bg-accent/80
                             focus:!ring-2 focus:!ring-accent/50" @click="toggleEditMode" />
                <Button v-if="isAdmin" label="Delete" icon="pi pi-trash" class="p-button-sm p-button-outlined
                             !border-red-500 !bg-red-500 !text-white hover:!bg-red-700
                             focus:!ring-2 focus:!ring-red-500" @click="deleteResidence" />
              </template>
              <template v-else>
                <Button v-if="isAdmin" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                             !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                             focus:!ring-2 focus:!ring-green-500/50" @click="updateResidence"
                  v-tooltip.bottom="'Saves general edits (if any). Resident/Vehicle adds are immediate.'" />
                <Button v-if="isAdmin" label="Cancel Edit" icon="pi pi-times" class="p-button-sm p-button-outlined
                             !border-gray-400 !bg-gray-400 !text-white hover:!bg-gray-500
                             focus:!ring-2 focus:!ring-gray-400/50" @click="toggleEditMode" />
              </template>
              <Button label="Close" class="p-button-sm p-button-text
                           !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialogAndReset('view')" />
            </div>
          </div>
        </Dialog>

        <!-- Create Residence Dialog (remains largely unchanged) -->
        <Dialog v-model:visible="dialogs.create" modal :closable="true" :showHeader="false"
          :style="{ width: '90%', maxWidth: '500px' }" @after-hide="createResidencePayload = { building: '', room: 0 }"
          contentClass="!bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-gray-100 !rounded-lg !shadow-xl !p-0">
          <div class="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Create New Residence</h2>
            <Button icon="pi pi-times"
              class="w-8 h-8 rounded-full text-gray-500 dark:text-gray-400 hover:!bg-gray-100 dark:hover:!bg-gray-700 focus:ring-2 focus:!ring-primary-500/50"
              @click="closeDialog('create')" aria-label="Close dialog" unstyled />
          </div>
          <div class="p-5 md:p-6 space-y-4">
            <InputText v-model="createResidencePayload.building" inputId="createResidenceBuilding"
              placeholder="Enter residence building" />
            <InputNumber v-model="createResidencePayload.room" inputId="createResidenceRoom"
              placeholder="Enter residence room" />
          </div>
          <div
            class="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
            <Button v-if="isAdmin" label="Save" icon="pi pi-save" class="p-button-sm p-button-outlined
                           !border-green-500 !bg-green-500 !text-white hover:!bg-green-700
                           focus:!ring-2 focus:!ring-accent/50" @click="createResidence"
              :disabled="!createResidencePayload.building || createResidencePayload.room <= 0" />
            <Button label="Cancel" class="p-button-sm p-button-text
                           !text-gray-700 dark:!text-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-700
                           focus:!ring-2 focus:!ring-gray-500/50" @click="closeDialog('create')" />
          </div>
        </Dialog>
      </div>
    </div>

    <FloatingButton v-if="isAdmin" icon="+" @click="openDialog('create')" aria-label="Add new residence" />
  </MenuLayout>
</template>

<style scoped>
.p-inputtext.p-component {
  width: 100%;
}

.dark #add-resident-dropdown,
.dark #add-vehicle-dropdown {
  border: 1px solid var(--p-content-border-color);
}
</style>