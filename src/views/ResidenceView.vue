<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import MenuLayout from '@/components/Menu/MenuLayout.vue';
import type { CreateResidence, Residence, User, Vehicle } from '@/types';
import { RefreshCw, Trash2, Pencil, Save } from "lucide-vue-next";
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
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const { isLoading, isMutated, page, limit, maxPage, isDetailLoading, dialogs, openDialog, closeDialog, selectedItem, itemList } = useState<Residence>({ limit: 20 });
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

const { role } = useAuth();
const isAdmin = computed(() => role.value === "ADMIN");

const createResidencePayload = ref<CreateResidence>({
  building: '',
  room: 0,
});

const getAllResidences = async () => {
  isLoading.value = true;
  try {
    const response = await residenceService.getAll(page.value, limit.value, { cache: !isMutated.value });
    itemList.value = response.data;
    maxPage.value = response.maxPage;
    isMutated.value = false;
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading residences');
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
    selectedItem.value = await residenceService.getById(id);
  } catch (error) {
    toast.error(error?.toString() ?? 'Error loading residence');
    closeDialogAndReset("view");
  } finally {
    isDetailLoading.value = false;
  }
};

const toggleEditMode = () => {
  isEditing.value = !isEditing.value;
  if (!isEditing.value) resetAddFields();
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
    toast.success('Residence created');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error creating residence');
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
    toast.success('Residence deleted');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error deleting residence');
  }
};

const addResident = async () => {
  if (!selectedItem.value || !selectedResidentToAdd.value) {
    toast.warning('Please select a resident from the search results first.');
    return;
  }
  try {
    await residenceService.addResident(selectedItem.value.id, selectedResidentToAdd.value.id);
    if (!selectedItem.value.residents?.find(u => u.id === selectedResidentToAdd.value?.id)) {
      selectedItem.value.residents = [...(selectedItem.value.residents || []), selectedResidentToAdd.value];
    }
    resetResidentSearch();
    toast.success('Resident added');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error adding resident');
  }
};

const removeResident = async (userId: number) => {
  if (!selectedItem.value) return;
  try {
    await residenceService.removeResident(selectedItem.value.id, userId);
    selectedItem.value.residents = selectedItem.value.residents?.filter((user) => user.id !== userId) || [];
    toast.success('Resident removed');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error removing resident');
  }
};

const selectResidentToAdd = (selectedUser: User) => {
  selectedResidentToAdd.value = selectedUser;
  residentInput.value = selectedUser.name;
  isUserSearchDropdownVisible.value = false;
  searchedUsers.value = [];
};

const closeUserSearchDropdown = (event: MouseEvent) => {
  const userDropdown = document.getElementById('add-resident-dropdown');
  const userInput = document.getElementById('add-resident-input');
  if (userDropdown &&
      !userDropdown.contains(event.target as Node) &&
      !userInput?.contains(event.target as Node)) {
    isUserSearchDropdownVisible.value = false;
  }
};

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
    toast.error('Failed to load users');
    searchedUsers.value = [];
    isUserSearchDropdownVisible.value = false;
  }
}, 500);

const addVehicle = async () => {
  if (!selectedItem.value || !selectedVehicleToAdd.value) {
    toast.warning('Please select a vehicle from the search results first.');
    return;
  }
  try {
    await residenceService.addVehicle(selectedItem.value.id, selectedVehicleToAdd.value.id);
    if (!selectedItem.value.vehicles?.find(v => v.id === selectedVehicleToAdd.value?.id)) {
      selectedItem.value.vehicles = [...(selectedItem.value.vehicles || []), selectedVehicleToAdd.value];
    }
    resetVehicleSearch();
    toast.success('Vehicle added');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error adding vehicle');
  }
};

const removeVehicle = async (vehicleId: number) => {
  if (!selectedItem.value) return;
  try {
    await residenceService.removeVehicle(selectedItem.value.id, vehicleId);
    selectedItem.value.vehicles = selectedItem.value.vehicles?.filter((vehicle) => vehicle.id !== vehicleId) || [];
    toast.success('Vehicle removed');
  } catch (error) {
    toast.error(error?.toString() ?? 'Error removing vehicle');
  }
};

const selectVehicleToAdd = (selectedVehicle: Vehicle) => {
  selectedVehicleToAdd.value = selectedVehicle;
  vehicleInput.value = selectedVehicle.plate;
  isVehicleSearchDropdownVisible.value = false;
  searchedVehicles.value = [];
};

const closeVehicleSearchDropdown = (event: MouseEvent) => {
  const vehicleDropdown = document.getElementById('add-vehicle-dropdown');
  const vehicleInputEl = document.getElementById('add-vehicle-input');
  if (vehicleDropdown &&
      !vehicleDropdown.contains(event.target as Node) &&
      !vehicleInputEl?.contains(event.target as Node)) {
    isVehicleSearchDropdownVisible.value = false;
  }
};

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
      const res = await vehicleService.search(value);
      searchedVehicles.value = res.filter(vehicle => !currentVehicleIds.includes(vehicle.id));
      isVehicleSearchDropdownVisible.value = searchedVehicles.value.length > 0;
    } catch (error) {
      toast.error('Failed to load vehicles');
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
};

const getVehicleTypeIcon = (type: string | undefined) => {
  if (!type) return '❓';
  switch (type.toUpperCase()) {
    case 'CAR': return '🚗';
    case 'MOTORBIKE': return '🏍️';
    default: return '❓';
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
};
const resetVehicleSearch = () => {
  vehicleInput.value = '';
  selectedVehicleToAdd.value = null;
  searchedVehicles.value = [];
  isVehicleSearchDropdownVisible.value = false;
};

const closeDialogAndReset = (dialogKey: keyof typeof dialogs.value) => {
  closeDialog(dialogKey);
  resetAddFields();
  isEditing.value = false;
};

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

const handleScroll = () => {
  const el = scrollContainer.value;
  if (el && !isLoading.value && page.value < maxPage.value) {
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
            toast.error('Failed to load more residences');
            page.value -= 1;
          })
          .finally(() => {
            isLoading.value = false;
          });
    }
  }
};
</script>

<template>
  <MenuLayout>
    <div ref="scrollContainer"
         class="min-h-screen p-4 md:p-6 bg-white text-gray-900 transition-colors duration-300 overflow-y-auto">
      <div class="max-w-7xl mx-auto">
        <Title name="Residences" @click="refreshData" class="mb-6" />
        <div v-if="isLoading && itemList.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <Skeleton v-for="i in limit" :key="i" class="h-32 w-full rounded-lg" />
        </div>
        <div v-else-if="itemList.length > 0"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <div v-for="residence in itemList" :key="residence.id"
               class="bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all duration-200 hover:shadow-xl hover:-translate-y-1 border border-blue-100 flex flex-col"
               @click="getResidenceDetail(residence.id)" role="button"
               :aria-label="`View details for Residence ${residence.building}-${residence.room}`">
            <div class="flex justify-between items-start mb-3 gap-2">
              <h2 class="font-semibold text-black line-clamp-1 break-all flex-1"
                  :title="`Building ${residence.building}, Room ${residence.room}`">
                <span class="mr-2 text-xs">🏢</span>{{ `Building ${residence.building} / Room ${residence.room}` }}
              </h2>
            </div>
            <div class="text-xs text-gray-400 mt-auto pt-2 border-t border-gray-100">
              ID: {{ residence.id }}
            </div>
          </div>
          <div v-if="isLoading && itemList.length > 0" class="col-span-full text-center py-4">
            <Skeleton class="h-6 w-24 mx-auto" />
            <span class="text-gray-500 ml-2">Loading more...</span>
          </div>
        </div>
        <EmptyMessage v-else-if="!isLoading && itemList.length === 0" message="No Residences Found."
                      @refresh="refreshData" :icon="RefreshCw" />

        <!-- Residence Detail Dialog -->
        <Dialog v-model:open="dialogs.view">
          <DialogContent class="max-w-5xl w-full p-0">
            <div>
              <div class="flex justify-between items-center p-8 border-b border-blue-100">
                <h2 class="text-2xl font-semibold text-gray-800">
                  {{ isEditing ? 'Edit Residence' : 'Residence Details' }}
                </h2>
              </div>
              <div v-if="isDetailLoading" class="p-10 text-center text-gray-500">
                <Skeleton class="h-6 w-2/5 mb-4 mx-auto" />
                <Skeleton class="h-4 w-full mb-2" />
                <Skeleton class="h-16 w-full mb-4" />
                <Skeleton class="h-5 w-3/5 mx-auto" />
                <p>Loading Details...</p>
              </div>
              <div v-if="selectedItem && !isDetailLoading" class="p-8 md:p-10 max-h-[80vh] overflow-y-auto">
                <div class="flex flex-col md:flex-row gap-10">
                  <!-- Residents Column -->
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-blue-700 mb-4">Residents</div>
                    <div v-if="selectedItem.residents?.length" class="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                      <div v-for="resident in selectedItem.residents" :key="resident.id"
                           class="flex items-center justify-between p-3 rounded bg-blue-50">
                        <div class="flex items-center gap-3">
                          <span class="text-blue-600 text-lg">👤</span>
                          <div class="flex flex-col leading-tight">
                            <span class="text-base font-medium text-gray-700">{{ resident.name }}</span>
                          </div>
                        </div>
                        <Button v-if="isEditing && isAdmin" variant="destructive" size="icon"
                                @click="removeResident(resident.id)">
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div v-else-if="!isEditing" class="text-base text-gray-400 italic mb-4">No residents assigned</div>
                    <div v-if="isEditing && isAdmin" class="relative">
                      <label for="add-resident-input" class="text-xs font-medium text-gray-500">Add Resident</label>
                      <div class="flex gap-2 items-center mt-2">
                        <div class="relative flex-grow">
                          <InputText v-model="residentInput" inputId="add-resident-input"
                                     placeholder="Search by name or email" class="w-full text-base"
                                     @focus="isUserSearchDropdownVisible = true" aria-autocomplete="list"
                                     aria-controls="add-resident-dropdown" />
                          <div id="add-resident-dropdown" v-if="isUserSearchDropdownVisible && searchedUsers.length > 0"
                               class="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            <div v-for="userOption in searchedUsers" :key="userOption.id"
                                 class="px-4 py-2 cursor-pointer hover:bg-blue-100"
                                 @click="selectResidentToAdd(userOption)">
                              <span class="font-medium">{{ userOption.name }}</span>
                              <span class="text-xs text-gray-500 ml-2">{{ userOption.email }}</span>
                            </div>
                          </div>
                          <div v-if="isUserSearchDropdownVisible && searchedUsers.length === 0 && residentInput.length >= 2"
                               class="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md p-3 text-base text-gray-500">
                            No matching users found.
                          </div>
                        </div>
                        <Button variant="secondary" size="icon" @click="addResident" :disabled="!selectedResidentToAdd">
                          <span class="text-lg">+</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <!-- Vehicles Column -->
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-blue-700 mb-4">Vehicles</div>
                    <div v-if="selectedItem.vehicles?.length" class="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                      <div v-for="vehicle in selectedItem.vehicles" :key="vehicle.id"
                           class="flex items-center justify-between p-3 rounded bg-blue-50">
                        <div class="flex items-center gap-3">
                          <span class="text-blue-600 text-lg">{{ getVehicleTypeIcon(vehicle.type) }}</span>
                          <div class="flex flex-col leading-tight">
                            <span class="text-base font-medium text-gray-700">{{ vehicle.plate }}</span>
                            <span class="text-xs text-gray-500">{{ vehicle.type }}</span>
                          </div>
                        </div>
                        <Button v-if="isEditing && isAdmin" variant="destructive" size="icon"
                                @click="removeVehicle(vehicle.id)">
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div v-else-if="!isEditing" class="text-base text-gray-400 italic mb-4">No vehicles registered</div>
                    <div v-if="isEditing && isAdmin" class="relative">
                      <label for="add-vehicle-input" class="text-xs font-medium text-gray-500">Add Vehicle</label>
                      <div class="flex gap-2 items-center mt-2">
                        <div class="relative flex-grow">
                          <InputText v-model="vehicleInput" inputId="add-vehicle-input"
                                     placeholder="Search by License Plate" class="w-full text-base"
                                     @focus="isVehicleSearchDropdownVisible = true" aria-autocomplete="list"
                                     aria-controls="add-vehicle-dropdown" />
                          <div id="add-vehicle-dropdown"
                               v-if="isVehicleSearchDropdownVisible && searchedVehicles.length > 0"
                               class="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                            <div v-for="vehicleOption in searchedVehicles" :key="vehicleOption.id"
                                 class="px-4 py-2 cursor-pointer hover:bg-blue-100"
                                 @click="selectVehicleToAdd(vehicleOption)">
                              <span class="font-medium">{{ vehicleOption.plate }}</span>
                              <span class="text-xs text-gray-500 ml-2">{{ vehicleOption.type }}</span>
                            </div>
                          </div>
                          <div v-if="isVehicleSearchDropdownVisible && searchedVehicles.length === 0 && vehicleInput.length >= 2"
                               class="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md p-3 text-base text-gray-500">
                            No matching vehicles found.
                          </div>
                        </div>
                        <Button variant="secondary" size="icon" @click="addVehicle" :disabled="!selectedVehicleToAdd">
                          <span class="text-lg">+</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- General Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                  <div>
                    <div class="flex justify-between items-start py-2">
                      <span class="text-base font-medium text-gray-500 w-1/3">ID</span>
                      <span class="text-base text-gray-800 text-right break-all">{{ selectedItem.id }}</span>
                    </div>
                    <div class="flex justify-between items-start py-2">
                      <span class="text-base font-medium text-gray-500 w-1/3">Building</span>
                      <span class="text-base text-gray-800 text-right">{{ selectedItem.building }}</span>
                    </div>
                    <div class="flex justify-between items-start py-2">
                      <span class="text-base font-medium text-gray-500 w-1/3">Room</span>
                      <span class="text-base text-gray-800 text-right">{{ selectedItem.room }}</span>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between items-start py-2">
                      <span class="text-base font-medium text-gray-500 w-1/3">Created At</span>
                      <span class="text-base text-gray-800 text-right">{{ new Date(selectedItem.createdAt).toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between items-start py-2">
                      <span class="text-base font-medium text-gray-500 w-1/3">Updated At</span>
                      <span class="text-base text-gray-800 text-right">{{ new Date(selectedItem.updatedAt).toLocaleString() }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter class="flex justify-end gap-4 p-6 border-t border-blue-100 bg-blue-50 rounded-b-lg">
                <template v-if="selectedItem && !isDetailLoading">
                  <template v-if="!isEditing">
                    <Button v-if="isAdmin" variant="secondary" @click="toggleEditMode"
                            class="bg-blue-600 hover:bg-blue-700 text-white">
                      <Pencil class="w-5 h-5 mr-2" />
                      Edit
                    </Button>
                    <Button v-if="isAdmin" variant="destructive" @click="deleteResidence">
                      <Trash2 class="w-5 h-5 mr-2" />
                      Delete
                    </Button>
                  </template>
                  <template v-else>
                    <Button v-if="isAdmin" variant="secondary" @click="updateResidence" class="bg-green-600 hover:bg-green-700 text-white">
                      <Save class="w-5 h-5 mr-2" />
                      Save
                    </Button>
                    <Button v-if="isAdmin" variant="outline" @click="toggleEditMode">
                      Cancel Edit
                    </Button>
                  </template>
                  <Button variant="ghost" @click="closeDialogAndReset('view')">
                    Close
                  </Button>
                </template>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <!-- Create Residence Dialog -->
        <Dialog v-model:open="dialogs.create">
          <DialogContent class="max-w-md w-full p-0">
            <div class="flex justify-between items-center p-5 border-b border-blue-100">
              <h2 class="text-xl font-semibold text-gray-800">Create New Residence</h2>
              <Button variant="ghost" size="icon" @click="closeDialog('create')" aria-label="Close dialog">
                <span class="text-lg">×</span>
              </Button>
            </div>
            <div class="p-5 md:p-6 space-y-4">
              <InputText v-model="createResidencePayload.building" inputId="createResidenceBuilding"
                         placeholder="Enter residence building" />
              <InputNumber v-model="createResidencePayload.room" inputId="createResidenceRoom"
                           placeholder="Enter residence room" />
            </div>
            <DialogFooter class="flex justify-end gap-3 p-4 border-t border-blue-100 bg-blue-50 rounded-b-xl">
              <Button v-if="isAdmin" variant="secondary" @click="createResidence"
                      :disabled="!createResidencePayload.building || createResidencePayload.room <= 0">
                Save
              </Button>
              <Button variant="ghost" @click="closeDialog('create')">
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    <FloatingButton v-if="isAdmin" icon="+" @click="openDialog('create')" aria-label="Add new residence" />
  </MenuLayout>
</template>